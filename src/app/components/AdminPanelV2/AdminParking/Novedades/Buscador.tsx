export default function Buscador({ searchTerm, setSearchTerm, setCurrentPage }: any){
  return <div className="my-4">
    <input type="text" placeholder="Buscar en novedades..." className="w-full border border-gray-300 rounded px-3 py-2"
      value={searchTerm} onChange={(e)=>{setSearchTerm(e.target.value); setCurrentPage(1)}} />
  </div>
}
