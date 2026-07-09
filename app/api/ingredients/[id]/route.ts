import { supabaseClient } from '@/utils/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/ingredients/{id}:
 *   get:
 *     summary: Get an ingredient by ID
 *     description: Retrieve a single ingredient by its ID, including computed stock_status. Requires a valid Bearer token.
 *     tags:
 *       - Ingredients
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ingredient ID
 *     responses:
 *       200:
 *         description: Successfully retrieved the ingredient
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
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
 *                     stock_status:
 *                       type: string
 *                       enum:
 *                         - habis
 *                         - rendah
 *                         - cukup
 *                       description: "Computed status: habis (0), rendah (1-20), cukup (>20)"
 *                 success:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Ingredient not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bahan baku tidak ditemukan
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
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);

  const { data, error } = await supabaseClient()
    .from('ingredients')
    .select('*')
    .eq('id', id)
    .single();

  if (!data) {
    return NextResponse.json(
      { message: 'Bahan baku tidak ditemukan', success: false },
      { status: 404 },
    );
  }

  if (error) {
    return NextResponse.json(
      { message: 'Something went wrong', success: false },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: {
      ...data,
      stock_status:
        data.stock_quantity === 0
          ? 'habis'
          : data.stock_quantity <= 20
            ? 'rendah'
            : 'cukup',
    },
    success: true,
  });
}

/**
 * @swagger
 * /api/ingredients/{id}:
 *   delete:
 *     summary: Delete an ingredient
 *     description: Delete an ingredient by ID. Requires a valid Bearer token and manager role.
 *     tags:
 *       - Ingredients
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ingredient ID
 *     responses:
 *       200:
 *         description: Ingredient deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bahan baku berhasil dihapus
 *                 success:
 *                   type: boolean
 *                   example: true
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader!.split(' ')[1];
  const id = Number(params.id);

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

  const { data: ingredient } = await supabaseClient()
    .from('ingredients')
    .select('image_url')
    .eq('id', id)
    .single();

  if (!ingredient) {
    return NextResponse.json(
      { message: 'Gambar tidak ditemukan', success: false },
      { status: 500 },
    );
  }

  const urlParts = ingredient.image_url.split('/public/ingredients/');

  if (urlParts.length > 1) {
    const filePath = decodeURIComponent(urlParts[1]);

    await supabaseClient().storage.from('ingredients').remove([filePath]);
  }

  const { error } = await supabaseClient()
    .from('ingredients')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { message: 'Something went wrong', success: false },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: 'Bahan baku berhasil dihapus',
    success: true,
  });
}

/**
 * @swagger
 * /api/ingredients/{id}:
 *   put:
 *     summary: Update an ingredient
 *     description: Update an ingredient by ID. All fields are optional. Requires a valid Bearer token and manager role.
 *     tags:
 *       - Ingredients
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ingredient ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - nama
 *               - unit
 *               - stock
 *               - gambar
 *             properties:
 *               nama:
 *                 type: string
 *                 description: The new name of the ingredient
 *                 example: Gula Merah
 *               unit:
 *                 type: string
 *                 description: The new unit of measurement
 *                 example: kg
 *               stok:
 *                 type: number
 *                 description: The new stock quantity
 *                 example: 100
 *               gambar:
 *                 type: string
 *                 description: The new image URL or file
 *     responses:
 *       200:
 *         description: Ingredient updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bahan baku berhasil diperbarui
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
 *       404:
 *         description: Ingredient not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bahan baku tidak ditemukan
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
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

  const authHeader = request.headers.get('authorization');
  const id = Number(params.id);

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

  const { data: checkIngredient } = await supabaseClient()
    .from('ingredients')
    .select('id')
    .eq('id', id)
    .single();

  if (!checkIngredient) {
    return NextResponse.json(
      { message: 'Ingredient tidak ditemukan', success: false },
      { status: 404 },
    );
  }

  const formData = await request.formData();
  const name = formData.get('nama') as string;
  const unit = formData.get('unit') as string;
  const stock = formData.get('stok') as string;
  const image = formData.get('gambar') as File | string | null;

  const formValue = [name, unit, stock, image];

  if (
    formValue.some(item => item === undefined || item === null || item === '')
  ) {
    return NextResponse.json(
      { message: 'Ada field yang masih kosong', success: false },
      { status: 400 },
    );
  }

  if (image === null) {
    return NextResponse.json(
      { message: 'File gambar masih kosong', success: false },
      { status: 400 },
    );
  }

  let imageUrl = '';

  if (typeof image === 'string') {
    imageUrl = image;
  }

  if (image instanceof File) {
    const imageName = `${Math.random()}-${name}`;

    const { data: uploadData, error: uploadErr } = await supabaseClient()
      .storage.from('ingredients')
      .upload(imageName, image, { upsert: true });

    if (uploadErr) {
      return NextResponse.json(
        { message: 'Gambar gagal di upload', success: false },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = supabaseClient()
      .storage.from('ingredients')
      .getPublicUrl(uploadData.path);

    imageUrl = publicUrlData.publicUrl;
  }

  const updatedIngredient = {
    name,
    unit,
    stock_quantity: Number(stock),
    image_url: imageUrl,
  };

  const { data, error } = await supabaseClient()
    .from('ingredients')
    .update(updatedIngredient)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { message: 'Something went wrong', success: false },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: 'Ingredient berhasil diperbarui',
    data,
    success: true,
  });
}
