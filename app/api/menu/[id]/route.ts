import { supabaseClient } from '@/utils/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/menu/{id}:
 *   get:
 *     summary: Get a menu item by ID
 *     description: Retrieve a single menu item along with its ingredients by ID.
 *     tags:
 *       - Menu
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The menu item ID.
 *     responses:
 *       200:
 *         description: Menu item retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     menu:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         price:
 *                           type: number
 *                         is_available:
 *                           type: boolean
 *                         image_url:
 *                           type: string
 *                         categories:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             name:
 *                               type: string
 *                     ingredients:
 *                       type: array
 *                       items:
 *                         type: object
 *                 success:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Menu item not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Menu tidak ditemukan
 *                 success:
 *                   type: boolean
 *                   example: false
 *       500:
 *         description: Internal server error.
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

  const { data: menu, error: menuErr } = await supabaseClient()
    .from('menus')
    .select(
      'id, name, description, price, is_available, image_url, categories(id, name)',
    )
    .eq('id', id)
    .single();

  if (!menu) {
    return NextResponse.json(
      { message: 'Menu tidak ditemukan', success: false },
      { status: 404 },
    );
  }

  const { data: ingredients } = await supabaseClient()
    .from('menu_ingredients')
    .select('*, ingredients(*)')
    .eq('menu_id', id);

  if (menuErr) {
    return NextResponse.json(
      { message: 'Something went wrong', success: false },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: { menu, ingredients },
    success: true,
  });
}

/**
 * @swagger
 * /api/menu/{id}:
 *   delete:
 *     summary: Delete a menu item
 *     description: Delete a menu item by ID. Requires manager role.
 *     tags:
 *       - Menu
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The menu item ID to delete.
 *     responses:
 *       204:
 *         description: Menu item deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Kategori berhasil dihapus
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized - not a manager.
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
 *         description: Internal server error.
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

  const { data: menu } = await supabaseClient()
    .from('menus')
    .select('image_url')
    .eq('id', id)
    .single();

  if (!menu) {
    return NextResponse.json(
      { message: 'Gambar tidak ditemukan', success: false },
      { status: 500 },
    );
  }

  const urlParts = menu.image_url.split('/public/ingredients/');

  if (urlParts.length > 1) {
    const filePath = decodeURIComponent(urlParts[1]);

    await supabaseClient().storage.from('menus').remove([filePath]);
  }

  const { error } = await supabaseClient().from('menus').delete().eq('id', id);

  if (error) {
    return NextResponse.json(
      { message: 'Something went wrong', success: false },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      message: 'Kategori berhasil dihapus',
      success: true,
    },
    { status: 204 },
  );
}

/**
 * @swagger
 * /api/menu/{id}:
 *   put:
 *     summary: Update a menu item
 *     description: Update an existing menu item by ID. Requires manager role.
 *     tags:
 *       - Menu
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The menu item ID to update.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - nama
 *               - deskripsi
 *               - harga
 *               - kategori_id
 *               - gambar
 *             properties:
 *               nama:
 *                 type: string
 *                 description: Menu item name.
 *               deskripsi:
 *                 type: string
 *                 description: Menu item description.
 *               harga:
 *                 type: number
 *                 description: Menu item price.
 *               kategori_id:
 *                 type: integer
 *                 description: Category ID.
 *               gambar:
 *                 type: string
 *                 description: Image URL or file for the menu item.
 *     responses:
 *       200:
 *         description: Menu item updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Kategori berhasil dibuat
 *                 data:
 *                   type: object
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Missing required fields.
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
 *         description: Unauthorized - not a manager.
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
 *         description: Menu item not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Menu tidak ditemukan
 *                 success:
 *                   type: boolean
 *                   example: false
 *       500:
 *         description: Internal server error.
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

  const { data: checkMenu } = await supabaseClient()
    .from('menus')
    .select('id')
    .eq('id', id)
    .single();

  if (!checkMenu) {
    return NextResponse.json(
      { message: 'Menu tidak ditemukan', success: false },
      { status: 404 },
    );
  }

  const formData = await request.formData();
  const name = formData.get('nama') as string;
  const description = formData.get('deskripsi') as string;
  const price = formData.get('harga') as string;
  const category_id = formData.get('kategori_id') as string;
  const image = formData.get('gambar') as File | string | null;

  const formValue = [name, description, price, category_id, image];

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
      { message: 'Gambar masih kosong', success: false },
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
      .storage.from('menus')
      .upload(imageName, image, { upsert: true });

    if (uploadErr) {
      return NextResponse.json(
        { message: 'Gambar gagal di upload', success: false },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = supabaseClient()
      .storage.from('menus')
      .getPublicUrl(uploadData.path);

    imageUrl = publicUrlData.publicUrl;
  }

  const updatedMenu = {
    name,
    description,
    price: Number(price),
    category_id: Number(category_id),
    image_url: imageUrl,
  };

  const { data, error } = await supabaseClient()
    .from('menus')
    .update(updatedMenu)
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
    message: 'Kategori berhasil dibuat',
    data,
    success: true,
  });
}
