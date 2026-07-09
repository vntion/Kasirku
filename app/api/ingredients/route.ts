import { supabaseClient } from '@/utils/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/ingredients:
 *   get:
 *     summary: Get all ingredients
 *     description: Retrieve a list of all ingredients with optional search and stock filter. Requires a valid Bearer token.
 *     tags:
 *       - Ingredients
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search ingredients by name (case-insensitive)
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum:
 *             - habis
 *             - rendah
 *             - cukup
 *         description: |
 *           Filter by stock status:
 *           - habis: stock = 0
 *           - rendah: stock > 0 and stock <= 20
 *           - cukup: stock > 20
 *     responses:
 *       200:
 *         description: Successfully retrieved ingredients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       unit:
 *                         type: string
 *                       stock_quantity:
 *                         type: integer
 *                       image_url:
 *                         type: string
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Something went wrong
 *                 success:
 *                   type: boolean
 *                   example: false
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search');
  const filter = searchParams.get('filter');

  let query = supabaseClient().from('ingredients').select('*');

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (filter === 'habis') {
    query = query.eq('stock_quantity', 0);
  } else if (filter === 'rendah') {
    query = query.gt('stock_quantity', 0).lte('stock_quantity', 20);
  } else if (filter === 'cukup') {
    query = query.gt('stock_quantity', 20);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { message: 'Something went wrong', success: false },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data,
    success: true,
  });
}

/**
 * @swagger
 * /api/ingredients:
 *   post:
 *     summary: Create a new ingredient
 *     description: Create a new ingredient with image upload. Requires a valid Bearer token and manager role.
 *     tags:
 *       - Ingredients
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - nama
 *               - unit
 *               - stok
 *               - gambar
 *             properties:
 *               nama:
 *                 type: string
 *                 description: The name of the ingredient
 *                 example: Gula Pasir
 *               unit:
 *                 type: string
 *                 description: The unit of measurement
 *                 example: kg
 *               stok:
 *                 type: string
 *                 description: The stock quantity
 *                 example: "50"
 *               gambar:
 *                 type: string
 *                 format: binary
 *                 description: The ingredient image file
 *     responses:
 *       200:
 *         description: Ingredient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bahan baku berhasil ditambahkan
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     unit:
 *                       type: string
 *                     stock_quantity:
 *                       type: integer
 *                     image_url:
 *                       type: string
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Validation error - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Ada field yang masih kosong
 *                 success:
 *                   type: boolean
 *                   example: false
 *       401:
 *         description: Unauthorized - not a manager
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *                 success:
 *                   type: boolean
 *                   example: false
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Something went wrong
 *                 success:
 *                   type: boolean
 *                   example: false
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';

  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json(
      {
        message:
          'Header content type tidak didukung. Harap menggunakan content type multipart/form-data',
        success: false,
      },
      { status: 415 },
    );
  }

  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader!.split(' ')[1];

    const { data: session } = await supabaseClient()
      .from('session_tokens')
      .select('users(role)')
      .eq('token', token)
      .single();

    if (session?.users?.role !== 'manager') {
      return NextResponse.json(
        { message: 'Unauthorized', success: false },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const name = formData.get('nama') as string;
    const unit = formData.get('unit') as string;
    const stock = formData.get('stok') as string;
    const image = formData.get('gambar') as File | null;

    const formValue = [name, unit, stock, image];

    if (
      formValue.some(item => item === undefined || item === null || item === '')
    ) {
      return NextResponse.json(
        { message: 'Ada field yang masih kosong', success: false },
        { status: 400 },
      );
    }

    if (!image) {
      return NextResponse.json(
        { message: 'Gambar masih kosong', success: false },
        { status: 400 },
      );
    }

    const imageName = `${Math.random()}-${name}`;

    const { data: uploadData, error: uploadErr } = await supabaseClient()
      .storage.from('ingredients')
      .upload(imageName, image);

    console.log(uploadErr);

    if (uploadErr) {
      return NextResponse.json(
        { message: 'Gambar gagal di upload', success: false },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = supabaseClient()
      .storage.from('ingredients')
      .getPublicUrl(uploadData.path);

    const newIngredient = {
      name,
      unit,
      stock_quantity: Number(stock),
      image_url: publicUrlData.publicUrl,
    };

    const { data: newIgntData, error: newIgntErr } = await supabaseClient()
      .from('ingredients')
      .insert(newIngredient)
      .select()
      .single();

    if (newIgntErr) {
      return NextResponse.json(
        {
          message: 'Ingredient gagal ditambahkan',
          success: false,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: 'Ingredient berhasil ditambahkan',
      data: newIgntData,
      success: true,
    });
  } catch (_) {
    return NextResponse.json(
      { message: 'Something went wrong', success: false },
      { status: 500 },
    );
  }
}
