import { cn } from "@/lib/utils";

export type AdinkraSymbol = {
  id: string;
  name: string;
  meaning: string;
  /** File under /brand/adinkra/ from the extracted contact sheet. */
  src: string;
};

/** Extracted Adinkra marks used across the footer ribbon and bottom nav. */
export const ADINKRA_SYMBOLS: AdinkraSymbol[] = [
  {
    id: "gye-nyame",
    name: "Gye Nyame",
    meaning: "Except for God",
    src: "/brand/adinkra/01.png",
  },
  {
    id: "adinkrahene",
    name: "Adinkrahene",
    meaning: "Greatness and leadership",
    src: "/brand/adinkra/02.png",
  },
  {
    id: "sankofa",
    name: "Sankofa",
    meaning: "Learn from the past",
    src: "/brand/adinkra/03.png",
  },
  {
    id: "sankofa-bird",
    name: "Sankofa",
    meaning: "Return and get it",
    src: "/brand/adinkra/04.png",
  },
  {
    id: "wawa-aba",
    name: "Wawa Aba",
    meaning: "Hardiness and perseverance",
    src: "/brand/adinkra/05.png",
  },
  {
    id: "bese-saka",
    name: "Bese Saka",
    meaning: "Abundance and unity",
    src: "/brand/adinkra/06.png",
  },
  {
    id: "akoma",
    name: "Akoma",
    meaning: "Patience and goodwill",
    src: "/brand/adinkra/07.png",
  },
  {
    id: "nyame-biribi",
    name: "Nyame Biribi Wo Soro",
    meaning: "Hope — God is in the heavens",
    src: "/brand/adinkra/08.png",
  },
  {
    id: "ananse-ntontan",
    name: "Ananse Ntontan",
    meaning: "Wisdom and creativity",
    src: "/brand/adinkra/09.png",
  },
  {
    id: "dwennimmen",
    name: "Dwennimmen",
    meaning: "Strength with humility",
    src: "/brand/adinkra/10.png",
  },
  {
    id: "pempamsie",
    name: "Pempamsie",
    meaning: "Readiness and steadfastness",
    src: "/brand/adinkra/11.png",
  },
  {
    id: "akoma-ntoso",
    name: "Akoma Ntoso",
    meaning: "Understanding and agreement",
    src: "/brand/adinkra/12.png",
  },
  {
    id: "aya",
    name: "Aya",
    meaning: "Endurance and resourcefulness",
    src: "/brand/adinkra/13.png",
  },
  {
    id: "asase-ye-duru",
    name: "Asase Ye Duru",
    meaning: "The Earth has weight",
    src: "/brand/adinkra/14.png",
  },
  {
    id: "eban",
    name: "Eban",
    meaning: "Safety of the home",
    src: "/brand/adinkra/15.png",
  },
  {
    id: "nkyinkyim",
    name: "Nkyinkyim",
    meaning: "Initiative and adaptability",
    src: "/brand/adinkra/16.png",
  },
  {
    id: "onyankopon-adom",
    name: "Onyankopon Adom",
    meaning: "By God's grace all will be well",
    src: "/brand/adinkra/17.png",
  },
  {
    id: "nsaa",
    name: "Nsaa",
    meaning: "Excellence and authenticity",
    src: "/brand/adinkra/18.png",
  },
  {
    id: "mate-masie",
    name: "Mate Masie",
    meaning: "I have heard and kept it",
    src: "/brand/adinkra/19.png",
  },
  {
    id: "mmusuyidee",
    name: "Mmusuyidee",
    meaning: "That which removes misfortune",
    src: "/brand/adinkra/20.png",
  },
  {
    id: "kwatakye-atiko",
    name: "Kwatakye Atiko",
    meaning: "Bravery and valor",
    src: "/brand/adinkra/21.png",
  },
  {
    id: "nsoromma",
    name: "Nsoromma",
    meaning: "Child of the heavens",
    src: "/brand/adinkra/22.png",
  },
];

export function getAdinkraSymbol(id: string): AdinkraSymbol {
  const symbol = ADINKRA_SYMBOLS.find((item) => item.id === id);
  if (!symbol) {
    throw new Error(`Unknown Adinkra symbol: ${id}`);
  }
  return symbol;
}

/** Black-ink PNG rendered in currentColor via CSS mask. */
export function AdinkraIcon({
  symbol,
  className,
  title,
}: {
  symbol: AdinkraSymbol;
  className?: string;
  title?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-block shrink-0 bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain] [-webkit-mask-position:center] [-webkit-mask-repeat:no-repeat] [-webkit-mask-size:contain]",
        className
      )}
      style={{
        WebkitMaskImage: `url(${symbol.src})`,
        maskImage: `url(${symbol.src})`,
      }}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title ? `${symbol.name}: ${symbol.meaning}` : undefined}
      title={title ? `${symbol.name} — ${symbol.meaning}` : undefined}
    />
  );
}

const RIBBON_IDS = [
  "gye-nyame",
  "adinkrahene",
  "sankofa",
  "akoma",
  "ananse-ntontan",
  "dwennimmen",
  "eban",
  "nkyinkyim",
  "mate-masie",
  "aya",
] as const;

/** Quiet static ribbon of extracted Adinkra marks for the glass footer. */
export function AdinkraFooterRibbon({ className }: { className?: string }) {
  const symbols = RIBBON_IDS.map((id) => getAdinkraSymbol(id));

  return (
    <div
      className={cn("pointer-events-none border-b border-black/6", className)}
      aria-hidden
    >
      <ul className="mx-auto flex max-w-lg items-center justify-between gap-1 px-4 py-1.5 text-[#b8893a]/70 sm:gap-2 sm:px-5">
        {symbols.map((symbol) => (
          <li key={symbol.id} className="flex items-center">
            <AdinkraIcon symbol={symbol} className="size-4 sm:size-[1.05rem]" />
          </li>
        ))}
      </ul>
    </div>
  );
}
