const { createApp, ref, computed, onMounted, onBeforeUnmount } = Vue;

createApp({
    setup() {
        const products = ref([]);
        const selectedCategory = ref('全部商品');
        const isCartOpen = ref(false);
        const isCheckoutOpen = ref(false); // 確保預設是 false
        const cart = ref([]);
        const detailItem = ref(null); // 控制說明視窗的顯示與內容
        
        // --- 會員登入相關 ---
        const isLoginOpen = ref(false);
        const currentUser = ref(null);
        const loginForm = ref({ email: '', password: '' });
        const loginError = ref('');
        
        // --- Banner 相關變數 ---
        const banners = ref([]);
        const currentBannerIndex = ref(0);
        let bannerTimer = null;

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
        
        const fetchBanners = async () => {
            try {
                const response = await fetch('/shoppingCart/banners.json');
                if (!response.ok) throw new Error('Banner 資料讀取失敗');
                banners.value = await response.json();
                startAutoPlay(); // 取得資料後開始輪播
            } catch (error) {
                console.error("Banner Error:", error);
            }
        };

        // --- Banner 輪播邏輯 ---
        const startAutoPlay = () => {
            stopAutoPlay(); // 確保不會重複設定計時器
            if (banners.value.length > 0) {
                bannerTimer = setInterval(() => {
                    currentBannerIndex.value = (currentBannerIndex.value + 1) % banners.value.length;
                }, 5000); // 每 5 秒切換一次
            }
        };

        const stopAutoPlay = () => {
            if (bannerTimer) clearInterval(bannerTimer);
        };

        const handleBannerClick = (banner) => {
            // 根據 banner 中的 productId 尋找對應商品物件
            const product = products.value.find(p => p.id === banner.productId);
            if (product) {
                showDetail(product);
            }
        };

        onMounted(() => {
            fetchProducts();
            fetchBanners();
        });
        
        // 元件卸載前清除計時器，避免記憶體洩漏
        onBeforeUnmount(() => {
            stopAutoPlay();
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
        
        // 登入邏輯
        const handleLogin = async () => {
            try {
                const response = await fetch('/shoppingCart/members.json');
                const members = await response.json();
                
                // 比對 email 與 auth_token
                const user = members.find(m => m.email === loginForm.value.email && m.auth_token === loginForm.value.password);
                
                if (user) {
                    currentUser.value = user;
                    // 自動帶入結帳表單
                    form.value = {
                        company: user.company,
                        empId: user.empId,
                        name: user.name,
                        phone: user.phone
                    };
                    isLoginOpen.value = false;
                    loginError.value = '';
                    loginForm.value = { email: '', password: '' };
                    alert(`歡迎回來，${user.name}！`);
                } else {
                    loginError.value = 'Email 或密碼錯誤';
                }
            } catch (error) {
                loginError.value = '無法連線至會員資料庫';
            }
        };

        const logout = () => {
            currentUser.value = null;
            form.value = { company: '', empId: '', name: '', phone: '' };
        };

        // 5. 結帳邏輯
        const openCheckout = () => {
            if (cart.value.length === 0) {
                alert("購物車內尚無商品！");
                return;
            }
            // 如果會員已登入，再次確保資料帶入
            if (currentUser.value) {
                form.value = {
                    company: currentUser.value.company,
                    empId: currentUser.value.empId,
                    name: currentUser.value.name,
                    phone: currentUser.value.phone
                };
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
            handleImageError,
            // 新增 Banner 相關回傳
            banners,
            currentBannerIndex,
            handleBannerClick,
            // 新增登入相關
            isLoginOpen,
            currentUser,
            loginForm,
            loginError,
            handleLogin,
            logout
        };
    }
}).mount('#app');