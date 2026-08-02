"use client";

const products = [
  { name: "Jogo 8 peças", stock: "Estoque 84 unidades", price: "R$ 168,00", color: "#FFDAD8" },
  { name: "Panela premium", stock: "Estoque 31 unidades", price: "R$ 224,00", color: "#F6BDB7" },
  { name: "Kit churrasco", stock: "Estoque 12 unidades", price: "R$ 349,00", color: "#F08D85" },
];

const filters = ["Todos", "Mais vendidos", "Baixa margem"];

export default function ProdutosPage() {
  return (
    <div className="clip rounded-[32px] bg-white p-8 flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#2A2933] text-[28px] font-bold font-['Inter'] leading-tight">
            Produtos
          </h1>
          <p className="text-[#616167] text-sm font-normal font-['Inter']">
            Catálogo, estoque e margem por item.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {filters.map((filter, i) => (
          <button
            key={filter}
            className={`px-3 py-2 rounded-full text-[13px] font-semibold font-['Inter'] transition-colors ${
              i === 0
                ? "bg-[#FFDAD8] text-[#2A2933]"
                : "bg-[#F8F6F4] text-[#2A2933]"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
        {products.map((product, i) => (
          <div
            key={i}
            className="bg-white rounded-[28px] p-5 flex flex-col gap-3 border border-[#E8E1DF]"
          >
            <div
              className="w-full h-[120px] rounded-[20px]"
              style={{ backgroundColor: product.color }}
            />
            <h3 className="text-[#2A2933] text-base font-bold font-['Inter']">
              {product.name}
            </h3>
            <span className="text-[#616167] text-[13px] font-normal font-['Inter']">
              {product.stock}
            </span>
            <span className="text-[#2A2933] text-lg font-bold font-['Inter']">
              {product.price}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
