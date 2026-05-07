const { createApp, ref, computed, onMounted } = Vue;

createApp({
    setup() {
        // --- 狀態定義 ---
        const products = ref([]);
        const isModalOpen = ref(false);
        const categories = ref(['電子電器', '美妝護理', '精品收藏', '旅行用品']);
        
        // 編輯用的暫存物件
        const tempProduct = ref({
            id: null,
            oldId: null, // 用於判斷是「新增」或「修改」模式
            name: '',
            category: '電子電器',
            price: 0,
            image: '',
            description: ''
        });

        // --- 資料初始化 ---
        const fetchProducts = async () => {
            try {
                // 請確保此路徑與您的 Tomcat 配置一致
                const response = await fetch('/shoppingCart/products.json');
                if (!response.ok) throw new Error('無法取得商品資料');
                products.value = await response.json();
            } catch (error) {
                console.error("讀取失敗:", error);
                // 若讀取失敗，預設給予空陣列避免程式崩潰
                products.value = [];
            }
        };

        // --- 視窗操作 ---
        const openModal = (item = null) => {
            if (item) {
                // 【修改模式】
                // 使用深拷貝避免即時更動到列表顯示
                tempProduct.value = { 
                    ...JSON.parse(JSON.stringify(item)), 
                    oldId: item.id,
                    description: item.description || '' // 確保有預設值防止錯誤 
                };
            } else {
                // 【新增模式】
                // 自動計算下一個建議 ID (最大 ID + 1)
                const nextId = products.value.length > 0 
                    ? Math.max(...products.value.map(p => p.id)) + 1 
                    : 1;
                
                tempProduct.value = {
                    id: nextId,
                    oldId: null, // 設為 null 代表這是新資料
                    name: '',
                    category: '電子電器',
                    price: 0,
                    image: ''
                };
            }
            isModalOpen.value = true;
        };

        const closeModal = () => {
            isModalOpen.value = false;
        };

        // --- 圖片處理 ---
        const uploadImage = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            // 限制檔案大小 (例如 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert("圖片太大囉！請選擇小於 2MB 的圖片");
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                // 將圖片轉為 Base64 字串存入 tempProduct
                tempProduct.value.image = e.target.result;
            };
            reader.readAsDataURL(file);
        };

        // --- 資料維護 (增/刪/改) ---
        const saveProduct = () => {
            const { id, oldId, name, price } = tempProduct.value;

            // 1. 基本檢核
            if (!id || !name || price <= 0) {
                alert("請完整填寫編號、名稱與價格！");
                return;
            }

            // 2. 模式判斷
            if (oldId === null) {
                // 【新增行為】
                // 檢查 ID 是否重複
                const isDuplicate = products.value.some(p => p.id === id);
                if (isDuplicate) {
                    alert(`編號 ${id} 已被其他商品使用，請更換編號。`);
                    return;
                }
                
                // 移除輔助用的 oldId 欄位後推入陣列
                const { oldId: _, ...cleanData } = tempProduct.value;
                products.value.push(cleanData);
            } else {
                // 【修改行為】
                const index = products.value.findIndex(p => p.id === oldId);
                if (index !== -1) {
                    const { oldId: _, ...cleanData } = tempProduct.value;
                    products.value[index] = cleanData;
                }
            }

            // 3. 後續處理
            console.log("當前最新商品 JSON 清單：", JSON.stringify(products.value));
            alert("本地儲存成功！\n提示：請記得將控制台輸出的 JSON 更新至 products.json 檔案。");
            closeModal();
        };

        const deleteProduct = (id) => {
            if (confirm(`確定要刪除商品編號 [${id}] 嗎？此動作無法復原。`)) {
                products.value = products.value.filter(p => p.id !== id);
                console.log("刪除後的商品清單：", JSON.stringify(products.value));
            }
        };

        // --- 生命週期 ---
        onMounted(fetchProducts);

        return {
            products,
            isModalOpen,
            categories,
            tempProduct,
            openModal,
            closeModal,
            uploadImage,
            saveProduct,
            deleteProduct
        };
    }
}).mount('#app');