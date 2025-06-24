/* filepath: c:\Users\janic\OneDrive\Área de Trabalho\Projetos\loja_dev\sw.js */
// Service Worker - PWA UseDev

const CACHE_NAME = 'usedev-v1.2.0';
const OFFLINE_URL = '/pages/offline.html';

// Recursos para cache imediato
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/pages/offline.html',
    '/pages/login.html',
    '/pages/carrinho.html',
    '/pages/perfil.html',
    '/pages/sobre.html',
    '/styles.css',
    '/css/cabecalho.css',
    '/css/rodape.css',
    '/css/components/dark-mode.css',
    '/css/pages/perfil.css',
    '/js/main.js',
    '/js/auth.js',
    '/js/perfil.js',
    '/js/dark-mode.js',
    '/js/carrinho.js',
    '/manifest.json'
];

// Recursos de imagens essenciais
const IMAGE_CACHE_URLS = [
    '/assets/icons/logo.svg',
    '/assets/icons/logo-verde.svg',
    '/assets/icons/search.svg',
    '/assets/icons/perfil.svg',
    '/assets/icons/carrinho.svg',
    '/assets/icons/heart.svg',
    '/assets/icons/user.svg',
    '/assets/icons/settings.svg',
    '/assets/icons/logout.svg'
];

// URLs que devem sempre buscar da rede primeiro
const NETWORK_FIRST_URLS = [
    '/js/auth.js',
    '/js/perfil.js'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...');
    
    event.waitUntil(
        (async () => {
            try {
                // Cache dos recursos estáticos
                const staticCache = await caches.open(CACHE_NAME);
                await staticCache.addAll(STATIC_CACHE_URLS);
                
                // Cache das imagens essenciais
                const imageCache = await caches.open(`${CACHE_NAME}-images`);
                await imageCache.addAll(IMAGE_CACHE_URLS);
                
                console.log('[SW] Cache inicial criado com sucesso!');
                
                // Forçar ativação imediata
                self.skipWaiting();
            } catch (error) {
                console.error('[SW] Erro durante instalação:', error);
            }
        })()
    );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Ativando Service Worker...');
    
    event.waitUntil(
        (async () => {
            try {
                // Limpar caches antigos
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames
                        .filter(cacheName => 
                            cacheName.startsWith('usedev-') && 
                            cacheName !== CACHE_NAME &&
                            !cacheName.includes('-images')
                        )
                        .map(cacheName => {
                            console.log('[SW] Removendo cache antigo:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
                
                // Assumir controle de todas as abas
                await self.clients.claim();
                
                console.log('[SW] Service Worker ativado com sucesso!');
            } catch (error) {
                console.error('[SW] Erro durante ativação:', error);
            }
        })()
    );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignorar requisições não HTTP/HTTPS
    if (!request.url.startsWith('http')) return;
    
    // Ignorar requisições para APIs externas específicas
    if (url.hostname === 'viacep.com.br') {
        return; // Deixar passar direto para API de CEP
    }
    
    event.respondWith(handleRequest(request));
});

// Estratégias de cache
async function handleRequest(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    try {
        // 1. Páginas HTML - Network First com fallback
        if (request.mode === 'navigate') {
            return await networkFirstWithFallback(request);
        }
        
        // 2. API calls ou JS críticos - Network First
        if (NETWORK_FIRST_URLS.some(url => pathname.includes(url))) {
            return await networkFirst(request);
        }
        
        // 3. CSS, JS, fontes - Cache First
        if (pathname.match(/\.(css|js|woff2?|ttf|eot)$/)) {
            return await cacheFirst(request);
        }
        
        // 4. Imagens - Cache First com network fallback
        if (pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)) {
            return await cacheFirstImages(request);
        }
        
        // 5. Outras requisições - Network First
        return await networkFirst(request);
        
    } catch (error) {
        console.error('[SW] Erro ao processar requisição:', error);
        return await getCachedResponse(request) || new Response('Erro de rede', { status: 503 });
    }
}

// Network First com fallback para offline
async function networkFirstWithFallback(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache da resposta para uso futuro
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Tentar cache primeiro
        const cachedResponse = await getCachedResponse(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback para página offline
        const offlineResponse = await caches.match(OFFLINE_URL);
        return offlineResponse || new Response('Página não disponível offline', { 
            status: 503,
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

// Network First
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        const cachedResponse = await getCachedResponse(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Cache First
async function cacheFirst(request) {
    const cachedResponse = await getCachedResponse(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        throw error;
    }
}

// Cache First para imagens
async function cacheFirstImages(request) {
    const imageCache = await caches.open(`${CACHE_NAME}-images`);
    const cachedResponse = await imageCache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            imageCache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Retornar imagem placeholder se disponível
        const placeholder = await imageCache.match('/assets/icons/placeholder.svg');
        return placeholder || new Response('', { status: 503 });
    }
}

// Buscar resposta em cache
async function getCachedResponse(request) {
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const response = await cache.match(request);
        if (response) {
            return response;
        }
    }
    
    return null;
}

// Background Sync para ações offline
self.addEventListener('sync', (event) => {
    console.log('[SW] Background Sync:', event.tag);
    
    if (event.tag === 'carrinho-sync') {
        event.waitUntil(syncCarrinho());
    }
    
    if (event.tag === 'perfil-sync') {
        event.waitUntil(syncPerfil());
    }
});

// Sync do carrinho
async function syncCarrinho() {
    try {
        const pendingActions = JSON.parse(localStorage.getItem('carrinho-pending') || '[]');
        
        for (const action of pendingActions) {
            // Simular envio para servidor
            console.log('[SW] Sincronizando carrinho:', action);
        }
        
        localStorage.removeItem('carrinho-pending');
        console.log('[SW] Carrinho sincronizado com sucesso!');
    } catch (error) {
        console.error('[SW] Erro ao sincronizar carrinho:', error);
    }
}

// Sync do perfil
async function syncPerfil() {
    try {
        const pendingProfile = JSON.parse(localStorage.getItem('perfil-pending') || '{}');
        
        if (Object.keys(pendingProfile).length > 0) {
            // Simular envio para servidor
            console.log('[SW] Sincronizando perfil:', pendingProfile);
            localStorage.removeItem('perfil-pending');
        }
        
        console.log('[SW] Perfil sincronizado com sucesso!');
    } catch (error) {
        console.error('[SW] Erro ao sincronizar perfil:', error);
    }
}

// Push Notifications
self.addEventListener('push', (event) => {
    console.log('[SW] Push recebido:', event);
    
    const options = {
        body: event.data ? event.data.text() : 'Nova notificação da UseDev!',
        icon: '/assets/pwa/icon-192x192.png',
        badge: '/assets/pwa/badge-72x72.png',
        image: '/assets/pwa/notification-image.png',
        vibrate: [200, 100, 200],
        data: {
            url: '/',
            timestamp: Date.now()
        },
        actions: [
            {
                action: 'open',
                title: 'Abrir',
                icon: '/assets/icons/open.svg'
            },
            {
                action: 'close',
                title: 'Fechar',
                icon: '/assets/icons/close.svg'
            }
        ],
        tag: 'usedev-notification',
        renotify: true,
        requireInteraction: false,
        silent: false
    };
    
    event.waitUntil(
        self.registration.showNotification('UseDev - Loja Geek', options)
    );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notificação clicada:', event);
    
    event.notification.close();
    
    if (event.action === 'close') {
        return;
    }
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Verificar se já existe uma aba aberta
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                
                // Abrir nova aba se necessário
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Compartilhamento Web Share Target
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHARE_TARGET') {
        console.log('[SW] Share Target recebido:', event.data);
        
        // Processar dados compartilhados
        const { title, text, url } = event.data;
        
        // Redirecionar para página de busca com termo compartilhado
        const searchTerm = title || text || '';
        const targetUrl = `/pages/busca.html?q=${encodeURIComponent(searchTerm)}`;
        
        clients.matchAll({ type: 'window' }).then((clientList) => {
            if (clientList.length > 0) {
                clientList[0].navigate(targetUrl);
                clientList[0].focus();
            } else {
                clients.openWindow(targetUrl);
            }
        });
    }
});

// Cleanup periódico do cache
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEANUP_CACHE') {
        event.waitUntil(cleanupCache());
    }
});

async function cleanupCache() {
    try {
        const imageCache = await caches.open(`${CACHE_NAME}-images`);
        const requests = await imageCache.keys();
        
        // Manter apenas os últimos 100 itens em cache de imagens
        if (requests.length > 100) {
            const toDelete = requests.slice(0, requests.length - 100);
            await Promise.all(toDelete.map(request => imageCache.delete(request)));
            console.log(`[SW] Cache limpo: ${toDelete.length} itens removidos`);
        }
    } catch (error) {
        console.error('[SW] Erro na limpeza do cache:', error);
    }
}

// Logging de performance
self.addEventListener('fetch', (event) => {
    const start = performance.now();
    
    event.respondWith(
        handleRequest(event.request).then((response) => {
            const duration = performance.now() - start;
            
            // Log apenas para requisições demoradas
            if (duration > 1000) {
                console.log(`[SW] Requisição lenta: ${event.request.url} (${duration.toFixed(2)}ms)`);
            }
            
            return response;
        })
    );
});