import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { unlink } from 'fs/promises';
import { getDb, dbAvailable } from '../services/db.js';
import { ensurePropertyDir, getStoragePath, getAbsolutePath } from '../services/fileStorage.js';
import { extractFromImage, extractFromText } from '../services/extraction.js';

export const documentsRouter = Router();

const dbGuard = (_req: any, res: any, next: any) => {
  if (!dbAvailable) return res.status(503).json({ error: 'Database not available' });
  next();
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, _file, cb) => {
    try {
      const dir = await ensurePropertyDir(parseInt(req.params.id as string));
      cb(null, dir);
    } catch (err) {
      cb(err as Error, '');
    }
  },
  filename: (_req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, `${randomUUID()}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and PDF files are allowed'));
    }
  },
});

// POST /api/properties/:id/documents — upload file
documentsRouter.post('/properties/:id/documents', dbGuard, upload.single('file'), async (req, res) => {
  const db = getDb()!;
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const propertyId = parseInt(req.params.id as string);
  const storagePath = getStoragePath(propertyId, file.filename);

  const { rows } = await db.query(
    `INSERT INTO documents (property_id, filename, original_name, mime_type, size_bytes, storage_path)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [propertyId, file.filename, file.originalname, file.mimetype, file.size, storagePath],
  );

  res.status(201).json(rows[0]);
});

// GET /api/properties/:id/documents — list documents
documentsRouter.get('/properties/:id/documents', dbGuard, async (req, res) => {
  const db = getDb()!;
  const { rows } = await db.query(
    'SELECT * FROM documents WHERE property_id = $1 ORDER BY uploaded_at DESC',
    [req.params.id],
  );
  res.json(rows);
});

// DELETE /api/documents/:docId
documentsRouter.delete('/documents/:docId', dbGuard, async (req, res) => {
  const db = getDb()!;
  const { rows } = await db.query('SELECT * FROM documents WHERE id = $1', [req.params.docId]);
  if (rows.length === 0) return res.status(404).json({ error: 'Document not found' });

  const doc = rows[0];
  try {
    await unlink(getAbsolutePath(doc.storage_path));
  } catch {
    // File may already be deleted
  }

  await db.query('DELETE FROM documents WHERE id = $1', [req.params.docId]);
  res.json({ deleted: true });
});

// POST /api/documents/:docId/extract — trigger AI extraction
documentsRouter.post('/documents/:docId/extract', dbGuard, async (req, res) => {
  const db = getDb()!;
  const { rows } = await db.query('SELECT * FROM documents WHERE id = $1', [req.params.docId]);
  if (rows.length === 0) return res.status(404).json({ error: 'Document not found' });

  const doc = rows[0];
  let extracted;

  try {
    if (doc.mime_type === 'application/pdf') {
      // For PDF, try text extraction first
      const pdfParse = (await import('pdf-parse')).default;
      const { readFile } = await import('fs/promises');
      const buffer = await readFile(getAbsolutePath(doc.storage_path));
      const pdfData = await pdfParse(buffer);

      if (pdfData.text.trim().length > 50) {
        extracted = await extractFromText(pdfData.text);
      } else {
        // Scanned PDF — fall back to image extraction
        extracted = await extractFromImage(doc.storage_path);
      }
    } else {
      extracted = await extractFromImage(doc.storage_path);
    }
  } catch (err: any) {
    return res.status(500).json({ error: 'Extraction failed', detail: err.message });
  }

  // Insert extracted fields
  for (const field of extracted) {
    await db.query(
      `INSERT INTO extracted_data (document_id, property_id, field_name, field_value, confidence, label)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [doc.id, doc.property_id, field.field_name, field.field_value, field.confidence, field.label || field.field_name],
    );
  }

  res.json({ extracted: extracted.length, fields: extracted });
});

// GET /api/documents/:docId/extracted — get extracted fields
documentsRouter.get('/documents/:docId/extracted', dbGuard, async (req, res) => {
  const db = getDb()!;
  const { rows } = await db.query(
    'SELECT * FROM extracted_data WHERE document_id = $1 ORDER BY id',
    [req.params.docId],
  );
  res.json(rows);
});

// PUT /api/extracted/:extractId — accept/reject a field
documentsRouter.put('/extracted/:extractId', dbGuard, async (req, res) => {
  const db = getDb()!;
  const { status, field_value } = req.body;
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be "accepted" or "rejected"' });
  }

  const { rows } = await db.query(
    `UPDATE extracted_data
     SET status = $1, field_value = COALESCE($2, field_value)
     WHERE id = $3
     RETURNING *`,
    [status, field_value, req.params.extractId],
  );

  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// POST /api/properties/:id/apply-extracted — apply accepted fields
documentsRouter.post('/properties/:id/apply-extracted', dbGuard, async (req, res) => {
  const db = getDb()!;
  const propertyId = parseInt(req.params.id as string);

  const { rows: accepted } = await db.query(
    `SELECT * FROM extracted_data WHERE property_id = $1 AND status = 'accepted'`,
    [propertyId],
  );

  if (accepted.length === 0) return res.json({ applied: 0 });

  // Map fields to their target tables
  const acquisitionFields: Record<string, string> = {
    purchase_price: 'purchase_price',
    closing_costs: 'closing_costs',
    renovation: 'renovation',
  };

  const financingFields: Record<string, string> = {
    down_payment_pct: 'down_payment_pct',
    interest_rate: 'interest_rate',
    loan_term_years: 'loan_term_years',
  };

  const incomeFields: Record<string, string> = {
    nightly_rate: 'nightly_rate',
    occupancy_pct: 'occupancy_pct',
    avg_stay_nights: 'avg_stay_nights',
  };

  const propertyFields: Record<string, string> = {
    property_type: 'property_type',
    unit_count: 'unit_count',
    address: 'address',
    city: 'city',
    state: 'state',
    zip: 'zip',
  };

  let applied = 0;

  for (const field of accepted) {
    const { field_name, field_value } = field;

    if (acquisitionFields[field_name]) {
      await db.query(
        `UPDATE acquisition_costs SET ${acquisitionFields[field_name]} = $1, updated_at = NOW() WHERE property_id = $2`,
        [field_value, propertyId],
      );
      applied++;
    } else if (financingFields[field_name]) {
      await db.query(
        `UPDATE financing SET ${financingFields[field_name]} = $1, updated_at = NOW() WHERE property_id = $2`,
        [field_value, propertyId],
      );
      applied++;
    } else if (incomeFields[field_name]) {
      await db.query(
        `UPDATE rental_income SET ${incomeFields[field_name]} = $1, updated_at = NOW() WHERE property_id = $2`,
        [field_value, propertyId],
      );
      applied++;
    } else if (propertyFields[field_name]) {
      await db.query(
        `UPDATE properties SET ${propertyFields[field_name]} = $1, updated_at = NOW() WHERE id = $2`,
        [field_value, propertyId],
      );
      applied++;
    } else if (field_name.startsWith('expense_')) {
      const category = field_name.replace('expense_', '');
      const label = category.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      await db.query(
        `INSERT INTO operating_expenses (property_id, category, label, amount, frequency)
         VALUES ($1, $2, $3, $4, $5)`,
        [propertyId, category, label, field_value, (field as any).frequency || 'annual'],
      );
      applied++;
    }

    // Mark as applied
    await db.query(`UPDATE extracted_data SET status = 'applied' WHERE id = $1`, [field.id]);
  }

  res.json({ applied });
});
