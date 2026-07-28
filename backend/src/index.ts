import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { authenticateToken, authorizeRole } from './middleware/auth';
import { validate } from './middleware/validate';
import { customerSchema, customerNotesSchema, productSchema, stockMovementSchema, challanSchema } from './validators';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Setup static folder for uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// Setup multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Initialize Prisma v7 with pg adapter
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key';

// ==========================================
// ROUTES
// ==========================================

// 1. Auth (/auth): Login route
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, role: user.role, email: user.email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protect all routes below this line
app.use(authenticateToken);

// ==========================================
// CUSTOMERS MODULE[cite: 1, 2]
// ==========================================

// Get all customers (with optional search)
app.get('/customers', async (req, res) => {
  try {
    const { search } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: String(search), mode: 'insensitive' as const } },
        { mobile: { contains: String(search) } }
      ]
    } : undefined;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take: limit, orderBy: { id: 'desc' } }),
      prisma.customer.count({ where })
    ]);

    res.json({ data: customers, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new customer
app.post('/customers', authorizeRole(['ADMIN', 'SALES']), validate(customerSchema), async (req, res) => {
  try {
    const customer = await prisma.customer.create({ data: req.body });
    res.status(201).json(customer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Edit a customer
app.put('/customers/:id', authorizeRole(['ADMIN', 'SALES']), validate(customerSchema), async (req, res) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(customer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get a single customer by ID
app.get('/customers/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: Number(req.params.id) },
      include: { challans: true }
    });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update customer notes/follow-up
app.put('/customers/:id/notes', authorizeRole(['ADMIN', 'SALES']), validate(customerNotesSchema), async (req, res) => {
  try {
    const { notes, followUpDate } = req.body;
    const customer = await prisma.customer.update({
      where: { id: Number(req.params.id) },
      data: { 
        notes, 
        followUpDate: followUpDate ? new Date(followUpDate) : null 
      },
    });
    res.json(customer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// PRODUCTS MODULE[cite: 1, 2]
// ==========================================

// Get all products
app.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({ skip, take: limit, orderBy: { id: 'desc' } }),
      prisma.product.count()
    ]);

    res.json({ data: products, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new product
app.post('/products', authorizeRole(['ADMIN', 'WAREHOUSE']), validate(productSchema), async (req, res) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json(product);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Edit a product
app.put('/products/:id', authorizeRole(['ADMIN', 'WAREHOUSE']), validate(productSchema), async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(product);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Upload product image
app.post('/products/:id/image', authorizeRole(['ADMIN', 'WAREHOUSE']), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    
    // Simulate S3 URL by returning local static URL
    const imageUrl = `/uploads/${req.file.filename}`;
    
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: { imageUrl },
    });
    res.json(product);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get stock movements
app.get('/movements', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        include: { product: true },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit
      }),
      prisma.stockMovement.count()
    ]);

    res.json({ data: movements, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update stock manually (creates a movement log)
app.put('/products/:id/stock', authorizeRole(['ADMIN', 'WAREHOUSE']), validate(stockMovementSchema), async (req, res) => {
  try {
    const { quantity, type, reason, createdBy } = req.body;
    const productId = Number(req.params.id);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found");

    const newStock = type === 'IN' ? product.currentStock + quantity : product.currentStock - quantity;

    await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { currentStock: newStock }
      }),
      prisma.stockMovement.create({
        data: { productId, quantity, type, reason, createdBy }
      })
    ]);

    res.json({ message: "Stock updated successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// CHALLANS MODULE[cite: 1, 2]
// ==========================================
// Get all challans
app.get('/challans', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [challans, total] = await Promise.all([
      prisma.challan.findMany({
        include: { customer: true, items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.challan.count()
    ]);
    res.json({ data: challans, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
// Create a Draft Challan
app.post('/challans', authorizeRole(['ADMIN', 'SALES']), validate(challanSchema), async (req, res) => {
  try {
    const { challanNo, customerId, createdBy, items } = req.body;
    
    const totalQty = items.reduce((sum: number, item: any) => sum + item.quantity, 0);

    const challan = await prisma.challan.create({
      data: {
        challanNo,
        customerId,
        createdBy,
        totalQty,
        status: 'DRAFT',
        items: {
          create: items // Array of items with snapshot data
        }
      },
      include: { items: true }
    });
    res.status(201).json(challan);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Confirm Challan (Crucial Business Logic with Transaction)
// Confirm Challan (Crucial Business Logic with Transaction)
app.put('/challans/:id/confirm', authorizeRole(['ADMIN', 'SALES']), async (req, res) => {
  const { id } = req.params;
  const { email } = req.body; 

  try {
    await prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({
        where: { id: Number(id) },
        include: { items: true }
      });

      if (!challan) throw new Error("Challan not found");
      if (challan.status !== 'DRAFT') throw new Error("Only drafts can be confirmed");

      // Loop through items and decrement stock
      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error(`Product ID ${item.productId} not found`);

        if (product.currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.snapshotName}. Have ${product.currentStock}, need ${item.quantity}`);
        }

        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: product.currentStock - item.quantity }
        });

        // Create movement log
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: 'OUT',
            reason: `Sales Challan #${challan.challanNo}`,
            createdBy: email || 'SYSTEM'
          }
        });
      }

      // Finally, update challan status
      await tx.challan.update({
        where: { id: Number(id) },
        data: { status: 'CONFIRMED' }
      });
    }, 
    {
      maxWait: 5000, // default: 2000
      timeout: 10000 // default: 5000
    }); // <-- Added timeout options here

    res.json({ message: "Challan confirmed and stock updated." });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});