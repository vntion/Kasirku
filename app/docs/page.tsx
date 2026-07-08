import { getApiDocs } from '@/utils/swagger';
import ReactSwagger from './ReactSwagger';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation — KasirKu',
  description:
    'Dokumentasi API interaktif untuk aplikasi KasirKu menggunakan Swagger UI',
};


/**
 * Halaman dokumentasi API di route /docs.
 * Server Component yang mengambil spesifikasi OpenAPI
 * lalu meneruskannya ke client component ReactSwagger.
 */
export default async function ApiDocsPage() {
  const spec = await getApiDocs();

  return (
    <section className="container mx-auto p-6 bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          KasirKu API Documentation
        </h1>
        <p className="mt-2 text-gray-600">
          Dokumentasi interaktif untuk seluruh endpoint API pada aplikasi
          KasirKu. Gunakan tombol <strong>Authorize</strong> untuk memasukkan
          Bearer token sebelum mengakses endpoint yang dilindungi.
        </p>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <ReactSwagger spec={spec as Record<string, unknown>} />
      </div>
    </section>
  );
}
