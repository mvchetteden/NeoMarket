const { createApp, ref, computed, onMounted, onUnmounted, watch } = Vue;

createApp({
    setup() {
        // Состояния загрузки и ошибок
        const isLoading = ref(false);
        const error = ref('');
        
        // Состояния UI
        const showProfile = ref(false);
        const showNotifications = ref(false);
        const showFavorites = ref(false);
        const showAuthModal = ref(false);
        const showAdmin = ref(false);
        const mobileMenuOpen = ref(false);
        const cartOpen = ref(false);
        const showCheckoutModal = ref(false);
        const showAddProductModal = ref(false);
        const checkoutStep = ref(1);
        const adminSection = ref('dashboard');
        const authMode = ref('login');
        const selectedProductId = ref(null);
        const showProfilePanel = ref(false);

        // Данные пользователя
        // Временно задаём пользователя для теста профиля
        const user = ref({
            name: 'Денис',
            email: 'denis@example.com',
            role: 'admin'
        });
        // Если нужно вернуть авторизацию — просто раскомментируй строку ниже
        // const user = ref(JSON.parse(localStorage.getItem('user')) || null);
        const canSeeAdmin = computed(() => user.value?.role === 'admin');

        // Корзина
        const cartItems = ref(JSON.parse(localStorage.getItem('cartItems') || '[]'));
        const subtotal = computed(() => cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0));
        const deliveryCost = computed(() => subtotal.value > 5000 ? 0 : 500);
        const total = computed(() => subtotal.value + deliveryCost.value);

        // Избранное
        const favorites = ref(JSON.parse(localStorage.getItem('favorites') || '[]'));
        
        // Уведомления
        const notifications = ref(JSON.parse(localStorage.getItem('notifications') || '[]'));

        // Товары и фильтрация
        const products = ref([
            { id: 1, name: 'Умная колонка', price: 4990, category: 'Электроника', image: 'https://via.placeholder.com/300x300/10B981/FFFFFF?text=Speaker', description: 'Голосовой помощник, музыка, умный дом.' },
            { id: 2, name: 'Беспроводные наушники', price: 6490, category: 'Электроника', image: 'https://via.placeholder.com/300x300/1E40AF/FFFFFF?text=Headphones', description: 'Чистый звук, Bluetooth 5.0, до 30 часов работы.' },
            { id: 3, name: 'Толстовка', price: 3290, category: 'Одежда', image: 'https://via.placeholder.com/300x300/F59E0B/FFFFFF?text=Hoodie', description: 'Экологичный материал, стильный дизайн.' },
            { id: 4, name: 'Умная лампа', price: 1990, category: 'Дом и сад', image: 'https://via.placeholder.com/300x300/6D28D9/FFFFFF?text=Lamp', description: 'RGB, управление со смартфона.' },
            { id: 5, name: 'Кроссовки', price: 5590, category: 'Спорт', image: 'https://via.placeholder.com/300x300/DC2626/FFFFFF?text=Sneakers', description: 'Лёгкие, дышащие, для бега и фитнеса.' },
            { id: 6, name: 'Маска для лица', price: 890, category: 'Красота', image: 'https://via.placeholder.com/300x300/F472B6/FFFFFF?text=Mask', description: 'Увлажнение и сияние кожи.' },
            { id: 7, name: 'Детский конструктор', price: 2490, category: 'Товары для детей', image: 'https://via.placeholder.com/300x300/34D399/FFFFFF?text=Kids+Blocks', description: 'Развивает моторику и воображение.' },
            { id: 8, name: 'Смарт-часы', price: 3490, category: 'Электроника', image: 'https://via.placeholder.com/300x300/10B981/FFFFFF?text=Watch', description: 'Мониторинг здоровья, уведомления, NFC.' }
        ]);

        const searchQuery = ref('');
        const activeCategory = ref(null);
        const sortKey = ref('default');
        const priceMin = ref(0);
        const priceMax = ref(100000);

        // Данные для админ-панели
        const salesData = ref([30, 45, 60, 75, 90, 85, 70]);
        const editingProduct = ref(null);
        const productForm = ref({
            name: '',
            price: 0,
            category: '',
            description: '',
            status: 'active',
            image: '' // добавлено поле для base64 изображения
        });

        // Формы
        const checkoutForm = ref({
            name: '',
            email: '',
            phone: '',
            address: '',
            comment: '',
            paymentMethod: 'card'
        });

        const authForm = ref({
            name: '',
            email: '',
            password: ''
        });

        const authError = ref('');
        const checkoutErrors = ref([]);

        // Computed properties
        const filteredProducts = computed(() => {
            let result = products.value;
            if (searchQuery.value.trim()) {
                const q = searchQuery.value.trim().toLowerCase();
                result = result.filter(p =>
                    p.name.toLowerCase().includes(q) ||
                    (p.description && p.description.toLowerCase().includes(q))
                );
            }
            if (activeCategory.value && activeCategory.value !== 'Все категории') {
                result = result.filter(p => p.category === activeCategory.value);
            }
            result = result.filter(p => p.price >= priceMin.value && p.price <= priceMax.value);
            if (sortKey.value === 'price-asc') {
                result = result.slice().sort((a, b) => a.price - b.price);
            } else if (sortKey.value === 'price-desc') {
                result = result.slice().sort((a, b) => b.price - a.price);
            } else if (sortKey.value === 'newest') {
                result = result.slice().sort((a, b) => b.id - a.id);
            }
            return result;
        });

        const selectedProduct = computed(() => 
            products.value.find(p => p.id === selectedProductId.value)
        );

        // Methods
        const addToCart = (product) => {
            try {
                const existingItem = cartItems.value.find(item => item.id === product.id);
                if (existingItem) {
                    existingItem.quantity++;
                } else {
                    cartItems.value.push({
                        ...product,
                        quantity: 1
                    });
                }
                
                addNotification(`Товар "${product.name}" добавлен в корзину`, 'success');
                cartOpen.value = true;
            } catch (e) {
                addNotification('Ошибка при добавлении товара в корзину', 'error');
            }
        };

        // Исправленный метод удаления из корзины
        const removeFromCart = (item) => {
            try {
                const index = cartItems.value.findIndex(i => i.id === item.id);
                if (index !== -1) {
                    const removed = cartItems.value.splice(index, 1)[0];
                    addNotification(`Товар "${removed.name}" удален из корзины`, 'info');
                    localStorage.setItem('cartItems', JSON.stringify(cartItems.value));
                }
            } catch (e) {
                addNotification('Ошибка при удалении товара из корзины', 'error');
            }
        };

        const increaseQuantity = (product) => {
            const item = cartItems.value.find(item => item.id === product.id);
            if (item) item.quantity++;
        };

        const decreaseQuantity = (product) => {
            const item = cartItems.value.find(item => item.id === product.id);
            if (item && item.quantity > 1) {
                item.quantity--;
            } else {
                removeFromCart(product);
            }
        };

        const openCart = () => {
            cartOpen.value = true;
        };

        const closeCart = () => {
            cartOpen.value = false;
        };

        const checkout = () => {
            showCheckoutModal.value = true;
            cartOpen.value = false;
        };

        const isFavorite = (product) => favorites.value.some(f => f.id === product.id);
        
        const toggleFavorite = (product) => {
            const idx = favorites.value.findIndex(f => f.id === product.id);
            if (idx === -1) {
                favorites.value.push(product);
                addNotification(`Товар "${product.name}" добавлен в избранное`, 'success');
            } else {
                favorites.value.splice(idx, 1);
                addNotification(`Товар "${product.name}" удален из избранного`, 'info');
            }
        };

        // Улучшенная валидация форм
        const validateEmail = (email) => {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        };

        const validatePhone = (phone) => {
            return /^\+?[1-9]\d{10,14}$/.test(phone);
        };

        const validateCheckout = () => {
            const errors = [];
            
            if (!checkoutForm.value.name.trim()) {
                errors.push('Введите имя');
            }
            
            if (!validateEmail(checkoutForm.value.email)) {
                errors.push('Введите корректный email');
            }
            
            if (!validatePhone(checkoutForm.value.phone)) {
                errors.push('Введите корректный номер телефона');
            }
            
            if (!checkoutForm.value.address.trim()) {
                errors.push('Введите адрес доставки');
            }
            
            checkoutErrors.value = errors;
            return errors.length === 0;
        };

        const validateAuth = () => {
            const errors = [];
            
            if (authMode.value === 'register' && !authForm.value.name.trim()) {
                errors.push('Введите имя');
            }
            
            if (!validateEmail(authForm.value.email)) {
                errors.push('Введите корректный email');
            }
            
            if (authForm.value.password.length < 6) {
                errors.push('Пароль должен содержать минимум 6 символов');
            }
            
            authError.value = errors.join(', ');
            return errors.length === 0;
        };

        const submitOrder = () => {
            if (!validateCheckout()) return;
            alert('Заказ оформлен!');
            cartItems.value = [];
            showCheckoutModal.value = false;
            cartOpen.value = false;
        };

        const closeCheckoutModal = () => {
            showCheckoutModal.value = false;
            checkoutStep.value = 1;
            checkoutErrors.value = [];
        };

        // Обновляем методы авторизации
        const login = () => {
            if (!validateAuth()) return;
            
            try {
                // Имитация запроса к API
                if (authForm.value.email === 'admin@site' && authForm.value.password === 'admin') {
                    user.value = { name: 'Админ', email: 'admin@site', role: 'admin' };
                } else {
                    user.value = { name: authForm.value.name || 'Пользователь', email: authForm.value.email, role: 'user' };
                }
                localStorage.setItem('user', JSON.stringify(user.value));
                showAuthModal.value = false;
                authError.value = '';
                addNotification('Вы успешно вошли в систему', 'success');
            } catch (e) {
                addNotification('Ошибка при входе в систему', 'error');
            }
        };

        const register = () => {
            if (!validateAuth()) return;
            
            try {
                user.value = { name: authForm.value.name, email: authForm.value.email, role: 'user' };
                localStorage.setItem('user', JSON.stringify(user.value));
                showAuthModal.value = false;
                authError.value = '';
                addNotification('Вы успешно зарегистрировались', 'success');
            } catch (e) {
                addNotification('Ошибка при регистрации', 'error');
            }
        };

        const logout = () => {
            user.value = null;
            showProfile.value = false;
            localStorage.removeItem('user');
            addNotification('Вы вышли из системы', 'info');
        };

        const toggleAdminPanel = () => {
            showAdmin.value = !showAdmin.value;
        };

        const closeAdminPanel = () => {
            showAdmin.value = false;
        };

        const handleImageUpload = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                productForm.value.image = e.target.result;
            };
            reader.readAsDataURL(file);
        };

        const editProduct = (product) => {
            editingProduct.value = product;
            productForm.value = { ...product };
            showAddProductModal.value = true;
        };

        const deleteProduct = (product) => {
            const index = products.value.findIndex(p => p.id === product.id);
            if (index > -1) {
                products.value.splice(index, 1);
                addNotification(`Товар "${product.name}" удален`, 'info');
            }
        };

        const saveProduct = () => {
            if (editingProduct.value) {
                const index = products.value.findIndex(p => p.id === editingProduct.value.id);
                if (index > -1) {
                    products.value[index] = { ...editingProduct.value, ...productForm.value };
                }
            } else {
                products.value.push({
                    id: Date.now(),
                    ...productForm.value
                });
            }
            localStorage.setItem('products', JSON.stringify(products.value));
            showAddProductModal.value = false;
            editingProduct.value = null;
            productForm.value = {
                name: '',
                price: 0,
                category: '',
                description: '',
                status: 'active',
                image: ''
            };
        };

        const formatPrice = (price) => {
            return new Intl.NumberFormat('ru-RU').format(price);
        };

        // Категории
        const categories = [
            'Электроника',
            'Одежда',
            'Дом и сад',
            'Красота',
            'Спорт',
            'Товары для детей'
        ];

        // Таймер акции
        const countdown = ref({ days: 2, hours: 18, minutes: 45, seconds: 33 });
        let timer = null;

        const bentoBlocks = ref([
            {
                id: 1,
                title: "Смарт-часы",
                price: "от 3 490 ₽",
                image: "https://via.placeholder.com/300x200/10B981/FFFFFF?text=Смарт-часы.webp"
            },
            {
                id: 2,
                title: "Аксессуары",
                price: "от 990 ₽",
                image: "https://via.placeholder.com/300x200/0369A1/FFFFFF?text=Аксессуары.webp"
            },
            {
                id: 3,
                title: "Бытовая техника",
                price: "от 5 990 ₽",
                image: "https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Техника.webp"
            },
            {
                id: 4,
                title: "Горящие скидки",
                price: "до -70%",
                image: "https://via.placeholder.com/300x200/DC2626/FFFFFF?text=Скидки.webp"
            }
        ]);

        const onBlockImageUpload = (event, block) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                block.image = e.target.result;
            };
            reader.readAsDataURL(file);
        };

        const saveBlocks = () => {
            localStorage.setItem('bentoBlocks', JSON.stringify(bentoBlocks.value));
        };

        const currentSlide = ref(0);
        let sliderTimer = null;
        const startBlockSlider = () => {
            if (sliderTimer) clearInterval(sliderTimer);
            sliderTimer = setInterval(() => {
                currentSlide.value = (currentSlide.value + 1) % bentoBlocks.value.length;
            }, 5000); // 5 секунд
        };

        const blocksPerPage = ref(3);
        const currentBlockPage = ref(1);
        const paginatedBlocks = computed(() => {
            const start = (currentBlockPage.value - 1) * blocksPerPage.value;
            return bentoBlocks.value.slice(start, start + blocksPerPage.value);
        });
        const totalBlockPages = computed(() => {
            return Math.ceil(bentoBlocks.value.length / blocksPerPage.value);
        });

        onMounted(() => {
            timer = setInterval(() => {
                let { days, hours, minutes, seconds } = countdown.value;
                if (seconds > 0) seconds--;
                else if (minutes > 0) { minutes--; seconds = 59; }
                else if (hours > 0) { hours--; minutes = 59; seconds = 59; }
                else if (days > 0) { days--; hours = 23; minutes = 59; seconds = 59; }
                countdown.value = { days, hours, minutes, seconds };
            }, 1000);

            const savedProducts = localStorage.getItem('products');
            if (savedProducts) {
                products.value = JSON.parse(savedProducts);
            }

            const savedBlocks = localStorage.getItem('bentoBlocks');
            if (savedBlocks) {
                bentoBlocks.value = JSON.parse(savedBlocks);
            }

            startBlockSlider();
        });

        onUnmounted(() => {
            if (timer) clearInterval(timer);
            if (sliderTimer) clearInterval(sliderTimer);
        });

        // Сохранение в localStorage
        watch(cartItems, (newValue) => {
            localStorage.setItem('cartItems', JSON.stringify(newValue));
        }, { deep: true });

        watch(favorites, (newValue) => {
            localStorage.setItem('favorites', JSON.stringify(newValue));
        }, { deep: true });

        watch(notifications, (newValue) => {
            localStorage.setItem('notifications', JSON.stringify(newValue));
        }, { deep: true });

        const clearCart = () => {
            try {
                cartItems.value = [];
                addNotification('Корзина очищена', 'info');
            } catch (e) {
                addNotification('Ошибка при очистке корзины', 'error');
            }
        };

        const updateQuantity = (productId, delta) => {
            try {
                const item = cartItems.value.find(item => item.id === productId);
                if (item) {
                    const newQuantity = item.quantity + delta;
                    if (newQuantity > 0) {
                        item.quantity = newQuantity;
                    } else {
                        removeFromCart(productId);
                    }
                }
            } catch (e) {
                addNotification('Ошибка при обновлении количества товара', 'error');
            }
        };

        // Улучшенная обработка уведомлений
        const removeNotification = (id) => {
            notifications.value = notifications.value.filter(n => n.id !== id);
        };

        const addNotification = (text, type = 'info') => {
            const id = Date.now();
            notifications.value.unshift({ id, text, type });
            
            // Автоматическое удаление через 5 секунд
            setTimeout(() => {
                removeNotification(id);
            }, 5000);
        };

        return {
            // Состояния загрузки и ошибок
            isLoading,
            error,
            
            // Состояния UI
            showProfile,
            showNotifications,
            showFavorites,
            showAuthModal,
            showAdmin,
            mobileMenuOpen,
            cartOpen,
            showCheckoutModal,
            showAddProductModal,
            checkoutStep,
            adminSection,
            authMode,
            selectedProductId,
            showProfilePanel,

            // Данные пользователя
            user,
            canSeeAdmin,

            // Корзина
            cartItems,
            subtotal,
            deliveryCost,
            total,
            addToCart,
            removeFromCart,
            increaseQuantity,
            decreaseQuantity,
            openCart,
            closeCart,
            checkout,

            // Избранное
            favorites,
            isFavorite,
            toggleFavorite,

            // Уведомления
            notifications,

            // Товары и фильтрация
            products,
            searchQuery,
            activeCategory,
            sortKey,
            priceMin,
            priceMax,
            filteredProducts,
            selectedProduct,

            // Формы и валидация
            checkoutForm,
            authForm,
            authError,
            checkoutErrors,
            validateCheckout,
            submitOrder,
            closeCheckoutModal,

            // Авторизация
            login,
            register,
            logout,

            // Админ-панель
            toggleAdminPanel,
            closeAdminPanel,
            salesData,
            editingProduct,
            productForm,
            handleImageUpload,
            editProduct,
            deleteProduct,
            saveProduct,

            // Вспомогательные функции
            formatPrice,

            // Данные
            categories,
            countdown,
            clearCart,
            updateQuantity,
            removeNotification,
            addNotification,
            bentoBlocks,
            onBlockImageUpload,
            saveBlocks,

            currentSlide,
            startBlockSlider,
            blocksPerPage,
            currentBlockPage,
            paginatedBlocks,
            totalBlockPages
        };
    }
}).mount('#app');
