export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-[#444] border-t-[#10a37f] rounded-full animate-spin" />
      <p className="text-[#676767] mt-4 text-sm">{message}</p>
    </div>
  )
}
