import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Package, Loader2, Boxes, Edit2, Check, X } from "lucide-react";
import type { Product } from "@shared/schema";

export default function WarehousePage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingQuantity, setEditingQuantity] = useState("");

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const addProductMutation = useMutation({
    mutationFn: async (data: { name: string; quantity: number }) => {
      return apiRequest("POST", "/api/products", {
        name: data.name,
        quantity: data.quantity,
        category: "other",
        lowStockThreshold: 10,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setName("");
      setQuantity("");
      toast({
        title: "Амжилттай",
        description: "Бүтээгдэхүүн амжилттай нэмэгдлээ",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Алдаа",
        description: error.message || "Бүтээгдэхүүн нэмэхэд алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; quantity: number }) => {
      return apiRequest("PATCH", `/api/products/${data.id}`, { name: data.name, quantity: data.quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditingId(null);
      setEditingName("");
      setEditingQuantity("");
      toast({
        title: "Амжилттай",
        description: "Бүтээгдэхүүний мэдээлэл амжилттай шинэчлэгдлээ",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Алдаа",
        description: error.message || "Бүтээгдэхүүний нэр шинэчлэхэд алдаа гарлаа",
        variant: "destructive",
      });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Анхааруулга",
        description: "Бүтээгдэхүүний нэр оруулна уу",
        variant: "destructive",
      });
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: "Анхааруулга",
        description: "Тоо хэмжээ зөв оруулна уу",
        variant: "destructive",
      });
      return;
    }

    addProductMutation.mutate({ 
      name: name.trim(), 
      quantity: qty,
    });
  }

  function handleEditClick(product: Product) {
    setEditingId(product.id);
    setEditingName(product.name);
    setEditingQuantity(product.quantity?.toString() || "0");
  }

  function handleSaveName(productId: string) {
    if (!editingName.trim()) {
      toast({
        title: "Анхааруулга",
        description: "Бүтээгдэхүүний нэр хоосон байж болохгүй",
        variant: "destructive",
      });
      return;
    }
    const qty = parseInt(editingQuantity, 10) || 0;
    updateProductMutation.mutate({ id: productId, name: editingName.trim(), quantity: qty });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditingName("");
    setEditingQuantity("");
  }

  const totalProducts = products.length;
  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm md:text-sm text-muted-foreground">Нийт бүтээгдэхүүн</p>
                <p className="text-xl md:text-2xl font-bold" data-testid="text-total-products">{totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Boxes className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm md:text-sm text-muted-foreground">Нийт тоо ширхэг</p>
                <p className="text-xl md:text-2xl font-bold truncate" data-testid="text-total-quantity">{totalQuantity.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="py-3 md:py-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-base">
            <Plus className="h-5 w-5" />
            Бүтээгдэхүүн нэмэх
          </CardTitle>
        </CardHeader>
        <CardContent className="py-3 md:py-3">
          <form onSubmit={handleSubmit} className="space-y-2 md:space-y-2">
            <div className="flex flex-col md:flex-row gap-2 md:gap-2">
              <Input
                type="text"
                placeholder="Бүтээгдэхүүний нэр"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 h-10 md:h-10 text-base md:text-sm"
                data-testid="input-product-name"
              />
              <Input
                type="number"
                min="1"
                placeholder="Тоо"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full md:w-28 h-10 md:h-10 text-base md:text-sm"
                data-testid="input-product-quantity"
              />
              <Button 
                type="submit" 
                disabled={addProductMutation.isPending}
                size="icon"
                className="h-10 w-10 md:h-10 md:w-10 flex-shrink-0"
                data-testid="button-add-product"
              >
                {addProductMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Бүтээгдэхүүний жагсаалт
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm md:text-sm">Агуулахад бүтээгдэхүүн байхгүй</p>
              <p className="text-xs md:text-xs mt-1">Дээрх формоор бүтээгдэхүүн нэмнэ үү</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm md:text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-2 md:py-3 px-2 md:px-4 font-medium text-muted-foreground text-xs md:text-sm w-12">№</th>
                    <th className="text-left py-2 md:py-3 px-2 md:px-4 font-medium text-muted-foreground text-xs md:text-sm">Бүтээгдэхүүний нэр</th>
                    <th className="text-right py-2 md:py-3 px-2 md:px-4 font-medium text-muted-foreground text-xs md:text-sm">Тоо</th>
                    <th className="text-center py-2 md:py-3 px-2 md:px-4 font-medium text-muted-foreground text-xs md:text-sm">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((product, index) => {
                    const isEditing = editingId === product.id;

                    return (
                      <tr 
                        key={product.id} 
                        className="hover-elevate"
                        data-testid={`row-warehouse-product-${product.id}`}
                      >
                        <td className="py-2 md:py-3 px-2 md:px-4 text-muted-foreground text-xs md:text-sm">{index + 1}</td>
                        <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">
                          {isEditing ? (
                            <Input
                              autoFocus
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="h-8 md:h-8 text-xs md:text-sm"
                              data-testid={`input-edit-product-name-${product.id}`}
                            />
                          ) : (
                            <span className="font-medium break-words" data-testid={`text-warehouse-product-name-${product.id}`}>
                              {product.name}
                            </span>
                          )}
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4 text-right text-xs md:text-sm">
                          {isEditing ? (
                            <Input
                              type="number"
                              min="0"
                              value={editingQuantity}
                              onChange={(e) => setEditingQuantity(e.target.value)}
                              className="h-8 md:h-8 w-20 ml-auto text-xs md:text-sm"
                              data-testid={`input-edit-product-quantity-${product.id}`}
                            />
                          ) : (
                            <span className="font-medium" data-testid={`text-warehouse-product-quantity-${product.id}`}>
                              {product.quantity.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 md:h-8 md:w-8 text-primary"
                                onClick={() => handleSaveName(product.id)}
                                disabled={updateProductMutation.isPending}
                                data-testid={`button-save-product-name-${product.id}`}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 md:h-8 md:w-8 text-muted-foreground"
                                onClick={handleCancelEdit}
                                data-testid={`button-cancel-edit-${product.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 md:h-8 md:w-8 text-muted-foreground hover:text-primary"
                              onClick={() => handleEditClick(product)}
                              data-testid={`button-edit-product-name-${product.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
