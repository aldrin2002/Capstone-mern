import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import CustomerSideNav from "../../pages/customer/customerSideNav";
import { useNavigate } from "react-router-dom";
import { Coffee } from "lucide-react";

const CustomerMenu = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Coffee");
  const [categories, setCategories] = useState([
    "Coffee", 
    "Tea", 
    "Pastry", 
    "Sandwich", 
    "Dessert", 
    "Other"
  ]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/products");
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load menu items");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products by category
  const filteredProducts = products.filter(
    (product) => product.category === activeCategory
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Sidebar */}
      <CustomerSideNav />

      {/* Main Content */}
      <main className={`flex-1 bg-white ${isMobile ? 'pb-20' : 'pb-0'}`}>
        {/* Category Navigation */}
        <div className="border-t border-b border-orange-300 sticky top-0 bg-white z-10">
          <div className="container mx-auto px-2">
            <nav className="flex overflow-x-auto py-2 hide-scrollbar">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`px-3 py-1.5 mx-1 whitespace-nowrap text-sm font-medium rounded-full transition-colors ${
                    activeCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Menu Content */}
        <div className="container mx-auto px-3 py-4">
          <h2 className="text-lg md:text-xl font-bold text-blue-900 mb-3">{activeCategory}</h2>

          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No products available in this category.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-16 md:mb-0">
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col h-auto">
                    <div className="h-24 bg-gray-100 flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img
                          src={`http://localhost:5000${product.image}`}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Coffee className="h-10 w-10 text-gray-400" />
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between items-start">
                        <h3 className="text-base font-medium text-gray-900 line-clamp-1">{product.name}</h3>
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded ml-1">
                          ₱{product.price.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                      {product.stock <= 5 && product.stock > 0 && (
                        <p className="text-xs text-orange-600 mt-1">Only {product.stock} left!</p>
                      )}
                      {product.stock === 0 && (
                        <p className="text-xs text-red-600 mt-1">Out of stock</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CustomerMenu;
