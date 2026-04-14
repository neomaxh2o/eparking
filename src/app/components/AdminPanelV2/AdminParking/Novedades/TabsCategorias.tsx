export default function TabsCategorias({ categorias, activeTab, setActiveTab, setCurrentPage }: any){
  return (
    <div className="flex space-x-4 border-b border-gray-300">
      {categorias.map((cat:any)=>(
        <button key={cat} className={`py-2 px-4 font-semibold border-b-2 ${activeTab===cat?'border-blue-600 text-blue-600':'border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-600'}`}
          onClick={()=>{setActiveTab(cat); setCurrentPage(1)}}>{cat}</button>
      ))}
    </div>
  )
}
