const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#141522] via-[#0F1117] to-[#080A0F]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4F4FFF]"></div>
    </div>
  )
}

export default LoadingSpinner 