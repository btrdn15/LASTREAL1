import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Search, ShoppingCart, Check, Loader2, Package, X } from "lucide-react";
import type { Product, CartItem } from "@shared/schema";

export default function SalesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productInputs, setProductInputs] = useState<Record<string, { quantity: string; price: string }>>({});
  const [customerName, setCustomerName] = useState("");

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const completeSaleMutation = useMutation({
    mutationFn: async (data: { items: CartItem[]; customerName: string }) => {
      return apiRequest("POST", "/api/transactions", { items: data.items, customerName: data.customerName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setCart([]);
      setProductInputs({});
      setCustomerName("");
      toast({
        title: "Амжилттай",
        description: "Борлуулалт амжилттай бүртгэгдлээ",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Алдаа",
        description: error.message || "Борлуулалт бүртгэхэд алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter((product) =>
      product.name.toLowerCase().includes(query) ||
      (product.barcode && product.barcode.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  }, [cart]);

  function handleInputChange(productId: string, productName: string, field: "quantity" | "price", value: string) {
    setProductInputs((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));

    const inputs = {
      ...productInputs[productId],
      [field]: value,
    };

    const quantity = parseFloat(inputs.quantity || "0");
    const price = parseFloat(inputs.price || "0");

    if (quantity > 0 && price > 0) {
      setCart((prev) => {
        const existing = prev.find((item) => item.productId === productId);
        if (existing) {
          return prev.map((item) =>
            item.productId === productId
              ? { ...item, quantity, price }
              : item
          );
        }
        return [...prev, { productId, productName, quantity, price }];
      });
    } else {
      setCart((prev) => prev.filter((item) => item.productId !== productId));
    }
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
    setProductInputs((prev) => {
      const newInputs = { ...prev };
      delete newInputs[productId];
      return newInputs;
    });
  }


  function handleCompleteSale() {
    if (cart.length === 0) {
      toast({
        title: "Анхааруулга",
        description: "Борлуулах бараа сонгоно уу",
        variant: "destructive",
      });
      return;
    }
    completeSaleMutation.mutate({ items: cart, customerName });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full md:gap-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Бүтээгдэхүүн хайх..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 text-base md:text-sm"
          data-testid="input-search"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 min-w-0">
        <div className="flex-1 flex flex-col overflow-hidden lg:min-w-0">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-base md:text-sm">
                {searchQuery ? "Бүтээгдэхүүн олдсонгүй" : "Агуулахад бүтээгдэхүүн байхгүй"}
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto space-y-3 pr-2">
              {filteredProducts.map((product, index) => {
                const inputs = productInputs[product.id] || { quantity: "", price: "" };
                const isInCart = cart.some((item) => item.productId === product.id);

                return (
                  <div
                    key={product.id}
                    className={`border rounded-lg p-3 md:p-2 space-y-2 md:space-y-1.5 ${isInCart ? "bg-primary/5 border-primary/20" : "bg-white dark:bg-slate-950"}`}
                    data-testid={`row-product-${product.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs md:text-sm text-muted-foreground font-medium">
                          {index + 1}
                        </span>
                        <p className="font-medium text-base md:text-base break-words" data-testid={`text-product-name-${product.id}`}>
                          {product.name}
                        </p>
                        <p className="text-base md:text-sm text-muted-foreground" data-testid={`text-product-quantity-${product.id}`}>
                          Үлдэгдэл: {product.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 md:gap-1">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Үнэ"
                        value={inputs.price ?? ""}
                        onChange={(e) => handleInputChange(product.id, product.name, "price", e.target.value)}
                        className="flex-1 md:w-28 h-10 md:h-8 px-3 md:px-2 py-2 md:py-1 text-base md:text-xs"
                        data-testid={`input-price-${product.id}`}
                      />
                      <Input
                        type="number"
                        min="0"
                        max={product.quantity}
                        placeholder="Тоо"
                        value={inputs.quantity ?? ""}
                        onChange={(e) => handleInputChange(product.id, product.name, "quantity", e.target.value)}
                        className="flex-1 md:w-20 h-10 md:h-8 px-3 md:px-2 py-2 md:py-1 text-base md:text-xs"
                        data-testid={`input-quantity-${product.id}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="w-full lg:w-72 lg:flex-shrink-0">
          <Card className="flex flex-col h-fit max-h-[calc(100vh-300px)]">
            <CardHeader className="py-3 md:py-3 border-b">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <ShoppingCart className="h-5 w-5" />
                Сагс
                {cart.length > 0 && (
                  <span className="ml-auto text-sm bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    {cart.length}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 mb-3 opacity-50" />
                  <p className="text-sm md:text-sm">Бараа сонгоогүй байна</p>
                </div>
              ) : (
                <div className="divide-y">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-start gap-3 px-4 py-3 md:py-2"
                      data-testid={`cart-item-${item.productId}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-base md:text-sm">{item.productName}</p>
                        <p className="text-base md:text-sm text-muted-foreground">
                          {item.quantity} x {item.price.toLocaleString()}₮
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-base md:text-sm">
                          {(item.quantity * item.price).toLocaleString()}₮
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 md:h-6 md:w-6 mt-1"
                          onClick={() => removeFromCart(item.productId)}
                          data-testid={`button-remove-${item.productId}`}
                        >
                          <X className="h-4 w-4 md:h-3 md:w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-4 border-t py-4">
              <div className="flex items-center justify-between w-full">
                <span className="text-muted-foreground text-base md:text-sm">Нийт дүн:</span>
                <span className="text-2xl md:text-2xl font-bold" data-testid="text-total-amount">
                  {totalAmount.toLocaleString()}₮
                </span>
              </div>
              <Input
                type="text"
                placeholder=""
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="text-base md:text-sm h-10 md:h-9"
                data-testid="input-customer-name"
              />
              <Button
                className="w-full text-base md:text-sm h-12 md:h-10"
                disabled={cart.length === 0 || completeSaleMutation.isPending}
                onClick={handleCompleteSale}
                data-testid="button-complete-sale"
              >
                {completeSaleMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Боловсруулж байна...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Дуусгах
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
