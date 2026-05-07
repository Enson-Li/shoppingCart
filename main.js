const { createApp, ref, computed, onMounted } = Vue;

createApp({
    setup() {
        const products = ref([]);
        const selectedCategory = ref('全部商品');
        const isCartOpen = ref(false);
        const isCheckoutOpen = ref(false); // 確保預設是 false
        const cart = ref([]);
        const detailItem = ref(null); // 控制說明視窗的顯示與內容

        const form = ref({
            company: '',
            empId: '',
            name: '',
            phone: ''
        });

        // 1. 自動從商品資料提取分類
        const categories = computed(() => {
            const list = products.value.map(p => p.category);
            return ['全部商品', ...new Set(list)];
        });

        // 2. 讀取商品資料
        const fetchProducts = async () => {
            try {
                const response = await fetch('/shoppingCart/products.json');
                if (!response.ok) throw new Error('資料讀取失敗');
                products.value = await response.json();
            } catch (error) {
                console.error("Error:", error);
            }
        };

        onMounted(() => {
            fetchProducts();
        });

        // 3. 過濾商品
        const filteredProducts = computed(() => {
            if (selectedCategory.value === '全部商品') return products.value;
            return products.value.filter(p => p.category === selectedCategory.value);
        });

        // 4. 購物車邏輯
        const cartCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0));
        const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0));
        
     // 開啟詳情視窗
        const showDetail = (product) => {
            detailItem.value = product;
        };

        const addToCart = (product) => {
            const existingItem = cart.value.find(item => item.id === product.id);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.value.push({ ...product, quantity: 1 });
            }
        };

        const removeFromCart = (productId) => {
            cart.value = cart.value.filter(item => item.id !== productId);
        };

        // 5. 結帳邏輯
        const openCheckout = () => {
            if (cart.value.length === 0) {
                alert("購物車內尚無商品！");
                return;
            }
            isCartOpen.value = false; // 先把側邊購物車關掉
            isCheckoutOpen.value = true; // 開啟結帳視窗
        };

        const submitOrder = async () => {
            const orderData = {
                user: { ...form.value },
                items: cart.value,
                total: cartTotal.value,
                timestamp: new Date().toISOString()
            };

            console.log("送出訂單：", orderData);
            alert("訂單已送出！");
            
            // 重設狀態
            cart.value = [];
            isCheckoutOpen.value = false;
            form.value = { company: '', empId: '', name: '', phone: '' };
        };
        
        // 在 setup 的 return 項目中加入這個方法
        const handleImageError = (event) => {
            // 當圖片載入失敗時，替換為佔位圖片
            event.target.src = 'https://via.placeholder.com/300?text=No+Image';
        };

        // 統一 Return
        return {
            products,
            categories,
            selectedCategory,
            filteredProducts,
            isCartOpen,
            isCheckoutOpen,
            cart,
            cartCount,
            cartTotal,
            form,
            addToCart,
            detailItem,
            showDetail,
            removeFromCart,
            openCheckout,
            submitOrder,
            handleImageError
        };
    }
}).mount('#app');