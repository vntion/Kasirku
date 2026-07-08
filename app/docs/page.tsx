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
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <ReactSwagger spec={spec as Record<string, unknown>} />
      </div>
    </section>
  );
}
