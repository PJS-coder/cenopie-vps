export default function Loading() {
  return (
    <div className="fixed inset-0 top-14 sm:top-16 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}