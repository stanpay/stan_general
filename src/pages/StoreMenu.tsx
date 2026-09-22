import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { fetchMenusByStoreName, getMenuAllergenLabels, type MenuItem } from "@/api/menus";
import {
  isMenuBoardStore,
  MENU_BOARD_MAP,
  normalizeStoreName,
} from "@/lib/menuBoardStores";
import {
  NAVER_MAP_DIRECTIONS_ALT,
  NAVER_MAP_DIRECTIONS_IMAGE,
} from "@/lib/mainBanners";
import { openNaverMapDirections } from "@/lib/mapDirectionLinks";
import { useAppLocale } from "@/contexts/AppLocaleContext";
import { useTranslatedKoreanText } from "@/hooks/useKoreanDisplayText";
import { storeMenuStrings } from "@/lib/locale";
import { translateKoTexts } from "@/lib/koTranslate";
import { AutoFitMarquee } from "@/components/AutoFitMarquee";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type CartQty = Record<string, number>;

type MenuLocationState = {
  lat?: number;
  lon?: number;
  name?: string;
};

function cartStorageKey(storeName: string): string {
  return `menu-cart:${normalizeStoreName(storeName)}`;
}

function loadCart(storeName: string): CartQty {
  try {
    const raw = localStorage.getItem(cartStorageKey(storeName));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CartQty;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function saveCart(storeName: string, cart: CartQty): void {
  localStorage.setItem(cartStorageKey(storeName), JSON.stringify(cart));
}

function formatPrice(price: number): string {
  return `₩${price.toLocaleString("ko-KR")}`;
}

function QuantityControl({
  value,
  onChange,
  size = "default",
  quantityLabel,
  decreaseAria,
  increaseAria,
}: {
  value: number;
  onChange: (next: number) => void;
  size?: "default" | "sm";
  quantityLabel: string;
  decreaseAria: string;
  increaseAria: string;
}) {
  const btnClass =
    size === "sm"
      ? "h-8 w-8 rounded-md bg-muted text-foreground"
      : "h-9 w-9 rounded-md bg-muted text-foreground";
  const numClass = size === "sm" ? "w-7 text-sm" : "w-8 text-sm";

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{quantityLabel}</span>
      <div className="ml-auto flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={btnClass}
          aria-label={decreaseAria}
          disabled={value <= 0}
          onClick={() => onChange(Math.max(0, value - 1))}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className={cn("text-center font-semibold tabular-nums", numClass)}>
          {value}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={btnClass}
          aria-label={increaseAria}
          onClick={() => onChange(value + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function MenuProductCard({
  item,
  qty,
  onQtyChange,
  showAllergens,
}: {
  item: MenuItem;
  qty: number;
  onQtyChange: (next: number) => void;
  showAllergens: boolean;
}) {
  const { locale } = useAppLocale();
  const sm = storeMenuStrings(locale);
  const displayName = useTranslatedKoreanText(item.menu_name, locale);
  const displayDescription = useTranslatedKoreanText(
    item.description ?? "",
    locale,
  );
  const [imgFailed, setImgFailed] = useState(false);
  const imageSrc = item.image_url?.trim() || null;
  const showImage = Boolean(imageSrc) && !imgFailed;
  const allergenLabels = showAllergens
    ? getMenuAllergenLabels(item, locale)
    : [];

  useEffect(() => {
    setImgFailed(false);
  }, [imageSrc]);

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="relative aspect-[4/3] bg-muted">
        {showImage ? (
          <img
            src={imageSrc!}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-muted" aria-hidden />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
          {displayName}
        </h3>
        {showAllergens && allergenLabels.length > 0 ? (
          <AutoFitMarquee
            as="p"
            text={`${sm.allergenPrefix} ${allergenLabels.join(", ")}`}
            textClassName="leading-snug text-muted-foreground"
            fontSizeClasses={["text-xs"]}
          />
        ) : null}
        {item.description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {displayDescription}
          </p>
        ) : null}
        <p className="text-base font-bold text-primary">
          {formatPrice(item.price)}
        </p>
        <div className="mt-auto pt-1">
          <QuantityControl
            value={qty}
            onChange={onQtyChange}
            quantityLabel={sm.quantity}
            decreaseAria={sm.quantityDecreaseAria}
            increaseAria={sm.quantityIncreaseAria}
          />
        </div>
      </div>
    </div>
  );
}

const StoreMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale } = useAppLocale();
  const { storeName: storeNameParam } = useParams<{ storeName: string }>();
  const storeName = normalizeStoreName(
    storeNameParam ? decodeURIComponent(storeNameParam) : "",
  );
  const locationState = (location.state as MenuLocationState | null) ?? null;
  const directionsAlt = NAVER_MAP_DIRECTIONS_ALT[locale];
  const sm = storeMenuStrings(locale);
  const displayStoreNameFallback = useTranslatedKoreanText(storeName, locale);
  const [translatedStoreName, setTranslatedStoreName] = useState<string | null>(
    null,
  );
  const displayStoreName =
    locale === "ko"
      ? storeName
      : (translatedStoreName ?? displayStoreNameFallback);

  const allowed = isMenuBoardStore(storeName);

  const { data: menus = [], isLoading, isError, error } = useQuery({
    queryKey: ["menus", storeName],
    queryFn: () => fetchMenusByStoreName(storeName),
    enabled: allowed && Boolean(storeName),
  });

  const [cart, setCart] = useState<CartQty>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [showAllergens, setShowAllergens] = useState(false);
  const [menuLabelsReady, setMenuLabelsReady] = useState(locale === "ko");

  const isFoodStore = useMemo(
    () => menus.some((m) => m.is_food === true),
    [menus],
  );

  useEffect(() => {
    if (!storeName) return;
    setCart(loadCart(storeName));
    setShowAllergens(false);
  }, [storeName]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [storeName]);

  useEffect(() => {
    if (!isFoodStore) setShowAllergens(false);
  }, [isFoodStore]);

  /** 메뉴명·설명을 먼저 번역해 두고, 카드는 캐시 히트로 바로 표시 */
  useEffect(() => {
    if (locale === "ko") {
      setMenuLabelsReady(true);
      setTranslatedStoreName(null);
      return;
    }
    if (isLoading) {
      setMenuLabelsReady(false);
      return;
    }
    if (menus.length === 0) {
      setMenuLabelsReady(true);
      void translateKoTexts([storeName], locale).then(([name]) => {
        setTranslatedStoreName(name);
      });
      return;
    }

    setMenuLabelsReady(false);
    let cancelled = false;
    const texts = [
      storeName,
      ...menus.flatMap((m) =>
        m.description ? [m.menu_name, m.description] : [m.menu_name],
      ),
    ];
    void translateKoTexts(texts, locale).then((translated) => {
      if (cancelled) return;
      setTranslatedStoreName(translated[0] ?? storeName);
      setMenuLabelsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [locale, menus, storeName, isLoading]);

  const showMenuSkeleton =
    isLoading || (locale !== "ko" && !menuLabelsReady && !isError);

  const setQty = useCallback(
    (menuId: number, next: number) => {
      setCart((prev) => {
        const key = String(menuId);
        const updated = { ...prev };
        if (next <= 0) {
          delete updated[key];
        } else {
          updated[key] = next;
        }
        if (storeName) saveCart(storeName, updated);
        return updated;
      });
    },
    [storeName],
  );

  const menuById = useMemo(() => {
    const map = new Map<number, MenuItem>();
    for (const m of menus) map.set(m.id, m);
    return map;
  }, [menus]);

  const { totalQty, totalPrice, lines } = useMemo(() => {
    let qtySum = 0;
    let priceSum = 0;
    const lineItems: { item: MenuItem; qty: number }[] = [];
    for (const [idStr, qty] of Object.entries(cart)) {
      if (qty <= 0) continue;
      const item = menuById.get(Number(idStr));
      if (!item) continue;
      qtySum += qty;
      priceSum += item.price * qty;
      lineItems.push({ item, qty });
    }
    lineItems.sort((a, b) => a.item.id - b.item.id);
    return { totalQty: qtySum, totalPrice: priceSum, lines: lineItems };
  }, [cart, menuById]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/main", { replace: true });
  };

  const handleNaverMapDirections = () => {
    const lat = locationState?.lat ?? MENU_BOARD_MAP.lat;
    const lon = locationState?.lon ?? MENU_BOARD_MAP.lon;
    openNaverMapDirections({
      lat,
      lon,
      name: locationState?.name?.trim() || storeName,
      placeId: MENU_BOARD_MAP.placeId,
      url: MENU_BOARD_MAP.webUrl,
    });
  };

  if (!allowed) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background px-4 pt-3">
        <header className="flex items-center gap-2 py-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="뒤로가기"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">{sm.pageTitleFallback}</h1>
        </header>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {sm.unavailableStore}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto flex min-h-screen max-w-md flex-col bg-background",
        totalQty > 0 && "pb-28",
      )}
    >
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/50 bg-background/95 px-3 py-2.5 backdrop-blur-sm">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="뒤로가기"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold">
          {displayStoreName}
        </h1>
      </header>

      <main className="flex-1 px-4 pt-4">
        <button
          type="button"
          className="mb-2 block w-full shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={directionsAlt}
          onClick={handleNaverMapDirections}
        >
          <img
            src={NAVER_MAP_DIRECTIONS_IMAGE[locale]}
            alt={directionsAlt}
            className="w-full object-contain"
          />
        </button>

        {isFoodStore ? (
          <div className="mb-4 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setShowAllergens((prev) => !prev)}
              disabled={showMenuSkeleton || menus.length === 0}
            >
              {sm.allergenToggle}
            </Button>
          </div>
        ) : null}

        {showMenuSkeleton && (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        )}

        {isError && (
          <p className="mt-8 text-center text-sm text-destructive">
            {sm.loadError}
            {error instanceof Error ? ` (${error.message})` : ""}
          </p>
        )}

        {!showMenuSkeleton && !isError && menus.length === 0 && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            {sm.emptyMenus}
          </p>
        )}

        {!showMenuSkeleton && !isError && menus.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {menus.map((item) => (
              <MenuProductCard
                key={`${item.id}-${locale}`}
                item={item}
                qty={cart[String(item.id)] ?? 0}
                onQtyChange={(next) => setQty(item.id, next)}
                showAllergens={showAllergens}
              />
            ))}
          </div>
        )}
      </main>

      {totalQty > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
          <div className="mx-auto flex max-w-md items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                {sm.selectedCount(totalQty)}
              </p>
              <p className="font-bold text-primary">{formatPrice(totalPrice)}</p>
            </div>
            <Button type="button" onClick={() => setCartOpen(true)}>
              {sm.cart}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{sm.cart}</DialogTitle>
          </DialogHeader>
          {lines.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {sm.cartEmpty}
            </p>
          ) : (
            <ul className="space-y-4">
              {lines.map(({ item, qty }) => (
                <CartLineItem
                  key={item.id}
                  item={item}
                  qty={qty}
                  onQtyChange={(next) => setQty(item.id, next)}
                />
              ))}
            </ul>
          )}
          {lines.length > 0 && (
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">{sm.total}</span>
              <span className="text-lg font-bold text-primary">
                {formatPrice(totalPrice)}
              </span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

function CartLineItem({
  item,
  qty,
  onQtyChange,
}: {
  item: MenuItem;
  qty: number;
  onQtyChange: (next: number) => void;
}) {
  const { locale } = useAppLocale();
  const sm = storeMenuStrings(locale);
  const displayName = useTranslatedKoreanText(item.menu_name, locale);

  return (
    <li className="flex gap-3 border-b border-border/50 pb-4 last:border-0">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{displayName}</p>
        <p className="text-sm font-bold text-primary">
          {formatPrice(item.price * qty)}
        </p>
        <div className="mt-2">
          <QuantityControl
            size="sm"
            value={qty}
            onChange={onQtyChange}
            quantityLabel={sm.quantity}
            decreaseAria={sm.quantityDecreaseAria}
            increaseAria={sm.quantityIncreaseAria}
          />
        </div>
      </div>
    </li>
  );
}

export default StoreMenu;
