
    // ============================================================
    // NAVBAR: sombra al hacer scroll
    // ============================================================
    const nav = document.querySelector('nav')

    window.addEventListener('scroll', () => {
        if (window.scrollY > 30) {
            nav?.classList.add('scrolled')
        } else {
            nav?.classList.remove('scrolled')
        }
    }, { passive: true })

    // ============================================================
    // ANIMACIONES REVEAL: elementos aparecen con fade al entrar
    // en el viewport usando IntersectionObserver.
    // ============================================================
    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible')
                    revealObserver.unobserve(entry.target)
                }
            })
        },
        { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    )

    document.querySelectorAll('.reveal').forEach((el) => {
        revealObserver.observe(el)
    })

    // ============================================================
    // SCROLL SUAVE: cierra el menú hamburguesa al hacer clic en un link
    // ============================================================
    document.querySelectorAll('.navbar-nav .nav-link[href^="#"]').forEach((link) => {
        link.addEventListener('click', () => {
            const collapse = document.querySelector('#navbarSupportedContent')
            if (collapse?.classList.contains('show')) {
                collapse.classList.remove('show')
            }
        })
    })
