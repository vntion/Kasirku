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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama:
 *                 type: string
 *                 description: The new name of the ingredient
 *                 example: Gula Merah
 *               unit:
 *                 type: string
 *                 description: The new unit of measurement
 *                 example: kg
 *               stock:
 *                 type: number
 *                 description: The new stock quantity
 *                 example: 100
 *               image_url:
 *                 type: string
 *                 description: The new image URL
 *                 example: https://example.com/image.jpg
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

  const formData = await request.formData();
  const nama = formData.get('nama') as string;
  const unit = formData.get('unit') as string;
  const stock = formData.get('stock') as string;
  const file = formData.get('image') as File | string;

  const hasImagePath = 

  const { data: checkIngredient } = await supabaseClient()
    .from('ingredients')
    .select('id')
    .eq('id', id)
    .single();

  if (!checkIngredient) {
    return NextResponse.json(
      { message: 'Bahan baku tidak ditemukan', success: false },
      { status: 404 },
    );
  }

  const updateData: Record<string, string | number | boolean> = {};
  if (nama !== undefined) updateData.name = nama;
  if (unit !== undefined) updateData.unit = unit;
  if (stock !== undefined) updateData.stock_quantity = stock;
  if (image_url !== undefined) updateData.image_url = image_url;

  const { data, error } = await supabaseClient()
    .from('ingredients')
    .update(updateData as any)
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
    message: 'Bahan baku berhasil diperbarui',
    data,
    success: true,
  });
}
