// ============================================================
    // CABAÑAS RELMU - Interacciones del sitio
    // ============================================================
    // Todas las animaciones respetan la preferencia del usuario
    // (prefers-reduced-motion) y se desactivan si el navegador lo pide.

    const prefiereMenosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ============================================================
    // 1. NAVBAR: sombra y compactación al hacer scroll
    // ============================================================
    const nav = document.querySelector('nav')

    const actualizarNav = () => {
        nav?.classList.toggle('scrolled', window.scrollY > 30)
    }

    // ============================================================
    // 2. BARRA DE PROGRESO DE LECTURA
    // ============================================================
    const barraProgreso = document.getElementById('barraProgreso')

    const actualizarProgreso = () => {
        if (!barraProgreso) return
        const recorrido = document.documentElement.scrollHeight - window.innerHeight
        const progreso = recorrido > 0 ? Math.min(window.scrollY / recorrido, 1) : 0
        barraProgreso.style.width = `${(progreso * 100).toFixed(2)}%`
    }

    // ============================================================
    // 3. BOTÓN VOLVER ARRIBA
    // ============================================================
    const btnArriba = document.getElementById('btnArriba')
    const btnContactoFlotante = document.querySelector('.btn-contacto-flotante')

    const actualizarBotonArriba = () => {
        btnArriba?.classList.toggle('visible', window.scrollY > 600)

        // El botón flotante de reserva aparece recién al pasar el hero
        const altoHero = document.getElementById('inicio')?.offsetHeight || 0
        btnContactoFlotante?.classList.toggle('visible', window.scrollY > altoHero * 0.75)
    }

    btnArriba?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefiereMenosMovimiento ? 'auto' : 'smooth' })
    })

    // Un único listener de scroll que agrupa las tres tareas anteriores
    let pendiente = false
    const alHacerScroll = () => {
        if (pendiente) return
        pendiente = true
        requestAnimationFrame(() => {
            actualizarNav()
            actualizarProgreso()
            actualizarBotonArriba()
            pendiente = false
        })
    }

    window.addEventListener('scroll', alHacerScroll, { passive: true })
    window.addEventListener('resize', actualizarProgreso)
    alHacerScroll()

    // ============================================================
    // 4. ANIMACIONES REVEAL (fade al entrar en pantalla)
    // ============================================================
    // Los elementos hermanos dentro de un mismo contenedor entran
    // escalonados, así las tarjetas aparecen una tras otra.
    const elementosAnimados = document.querySelectorAll(
        '.reveal, .reveal-izq, .reveal-der, .reveal-zoom'
    )

    elementosAnimados.forEach((elemento) => {
        if (elemento.style.getPropertyValue('--reveal-delay')) return
        const hermanos = Array.from(elemento.parentElement?.children || []).filter((nodo) =>
            nodo.matches('.reveal, .reveal-izq, .reveal-der, .reveal-zoom')
        )
        const indice = hermanos.indexOf(elemento)
        if (indice > 0) {
            elemento.style.setProperty('--reveal-delay', `${Math.min(indice, 6) * 0.09}s`)
        }
    })

    const observadorReveal = new IntersectionObserver(
        (entradas) => {
            entradas.forEach((entrada) => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add('visible')
                    observadorReveal.unobserve(entrada.target)
                }
            })
        },
        { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    )

    elementosAnimados.forEach((elemento) => observadorReveal.observe(elemento))

    // ============================================================
    // 5. CONTADORES ANIMADOS (franja de datos rápidos)
    // ============================================================
    const formatearNumero = (valor, prefijo = '', miles = false) => {
        const numero = miles ? valor.toLocaleString('es-CL') : String(valor)
        return `${prefijo}${numero}`
    }

    const animarContador = (elemento) => {
        const objetivo = Number(elemento.dataset.contador)
        if (!Number.isFinite(objetivo)) return

        const prefijo = elemento.dataset.prefijo || ''
        const miles = elemento.dataset.miles === 'true'
        const sufijo = elemento.dataset.sufijo || ''

        const pintar = (valor) => {
            elemento.textContent = formatearNumero(valor, prefijo, miles)
            if (sufijo) {
                const span = document.createElement('span')
                span.className = 'sufijo'
                span.textContent = sufijo
                elemento.appendChild(span)
            }
        }

        if (prefiereMenosMovimiento) {
            pintar(objetivo)
            return
        }

        const duracion = 1500
        const inicio = performance.now()

        const paso = (ahora) => {
            const avance = Math.min((ahora - inicio) / duracion, 1)
            const suavizado = 1 - Math.pow(1 - avance, 3) // easing de salida
            pintar(Math.round(objetivo * suavizado))
            if (avance < 1) requestAnimationFrame(paso)
        }

        requestAnimationFrame(paso)
    }

    const observadorContadores = new IntersectionObserver(
        (entradas) => {
            entradas.forEach((entrada) => {
                if (entrada.isIntersecting) {
                    animarContador(entrada.target)
                    observadorContadores.unobserve(entrada.target)
                }
            })
        },
        { threshold: 0.5 }
    )

    document.querySelectorAll('[data-contador]').forEach((el) => observadorContadores.observe(el))

    // ============================================================
    // 6. SCROLLSPY: marca el enlace de la sección visible
    // ============================================================
    const enlacesNav = document.querySelectorAll('.navbar-nav .nav-link')

    const marcarEnlaceActivo = (id) => {
        enlacesNav.forEach((enlace) => {
            const activo = enlace.getAttribute('href') === `#${id}`
            enlace.classList.toggle('active', activo)
            if (activo) {
                enlace.setAttribute('aria-current', 'page')
            } else {
                enlace.removeAttribute('aria-current')
            }
        })
    }

    const seccionesObservadas = Array.from(enlacesNav)
        .map((enlace) => document.querySelector(enlace.getAttribute('href')))
        .filter(Boolean)

    if (seccionesObservadas.length) {
        const observadorSecciones = new IntersectionObserver(
            (entradas) => {
                entradas.forEach((entrada) => {
                    if (entrada.isIntersecting) marcarEnlaceActivo(entrada.target.id)
                })
            },
            { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
        )
        seccionesObservadas.forEach((seccion) => observadorSecciones.observe(seccion))
    }

    // ============================================================
    // 7. CARRUSEL DEL HERO: se pausa cuando no se ve (rendimiento)
    // ============================================================
    const elementoCarrusel = document.getElementById('hero')
    const seccionHero = document.getElementById('inicio')

    if (elementoCarrusel && seccionHero && window.bootstrap) {
        const carrusel = window.bootstrap.Carousel.getOrCreateInstance(elementoCarrusel, {
            interval: 7000,
            ride: 'carousel',
            pause: 'hover',
            touch: true,
        })

        const observadorHero = new IntersectionObserver(
            ([entrada]) => {
                if (entrada.isIntersecting && !prefiereMenosMovimiento) {
                    carrusel.cycle()
                } else {
                    carrusel.pause()
                }
            },
            { threshold: 0.12 }
        )

        observadorHero.observe(seccionHero)
    }

    // ============================================================
    // 8. MENÚ MÓVIL: se cierra al elegir una opción
    // ============================================================
    const cerrarMenuMovil = () => {
        const menu = document.querySelector('#navbarSupportedContent')
        if (menu?.classList.contains('show')) {
            menu.classList.remove('show')
        }
    }

    document.querySelectorAll('.navbar-nav .nav-link[href^="#"]').forEach((enlace) => {
        enlace.addEventListener('click', cerrarMenuMovil)
    })

    document.querySelectorAll('.navbar-collapse .btn-reservar').forEach((boton) => {
        boton.addEventListener('click', cerrarMenuMovil)
    })

    // ============================================================
    // 9. ATRACTIVOS TURÍSTICOS: filtros por categoría
    // ============================================================
    const botonesFiltro = document.querySelectorAll('.filtro')
    const galeria = document.getElementById('galeria-atractivos')
    const tarjetasAtractivo = document.querySelectorAll('.atractivo')

    const aplicarFiltro = (categoria) => {
        if (!galeria || galeria.dataset.categoriaActiva === categoria) return
        galeria.dataset.categoriaActiva = categoria

        botonesFiltro.forEach((boton) => {
            const activo = boton.dataset.filtro === categoria
            boton.classList.toggle('activo', activo)
            boton.classList.toggle('apagado', !activo)
            boton.setAttribute('aria-pressed', String(activo))
        })

        // Salida suave y entrada escalonada de las tarjetas
        galeria.classList.add('saliendo')

        window.setTimeout(() => {
            tarjetasAtractivo.forEach((tarjeta) => {
                const coincide = tarjeta.dataset.categoria === categoria
                tarjeta.hidden = !coincide
                if (coincide) {
                    // Reinicia la animación de entrada de cada tarjeta
                    tarjeta.style.animation = 'none'
                    void tarjeta.offsetWidth
                    tarjeta.style.animation = ''
                }
            })
            galeria.classList.remove('saliendo')
        }, prefiereMenosMovimiento ? 0 : 240)
    }

    botonesFiltro.forEach((boton) => {
        boton.addEventListener('click', () => aplicarFiltro(boton.dataset.filtro))
    })

    // ============================================================
    // 10. MODAL DE DETALLE DE CABAÑA
    // ============================================================
    // La información proviene de la propia página (valores y
    // comodidades publicadas en el sitio).
    const CABANAS = {
        pequena: {
            nombre: 'Cabañas Pequeñas',
            capacidad: '2 a 3 personas',
            imagen: 'assets/img/cabana-pequena.webp',
            alt: 'Cabañas pequeñas de madera en Relmu',
            descripcion:
                'Un espacio acogedor para parejas o viajes en grupo pequeño, con todo lo necesario para una estadía cómoda y sin complicaciones.',
            incluye: ['Cocina americana equipada', 'TV cable', 'Terraza para compartir', 'Baño equipado'],
            precios: [
                ['2 personas', '$40.000'],
                ['3 personas', '$47.000'],
            ],
            desde: '$40.000',
        },
        grande: {
            nombre: 'Cabañas Grandes',
            capacidad: '4 a 8 personas',
            imagen: 'assets/img/cabana-grande.webp',
            alt: 'Cabañas grandes de madera en Relmu',
            descripcion:
                'Pensada para familias o grupos de amigos que quieren compartir sin perder comodidad, con espacios amplios de madera y terraza.',
            incluye: ['Cocina americana equipada', 'TV cable', 'Terraza para compartir', 'Baño equipado'],
            precios: [
                ['4 a 5 personas', '$65.000'],
                ['6 a 8 personas', '$80.000'],
            ],
            desde: '$65.000',
        },
        casa: {
            nombre: 'Casa Grande',
            capacidad: '9 a 12 personas',
            imagen: 'assets/img/casa-grande.webp',
            alt: 'Casa grande de Relmu',
            descripcion:
                'El alojamiento más amplio del centro, ideal para grupos grandes, encuentros familiares o celebraciones en un entorno de bosque.',
            incluye: ['Cocina americana equipada', 'TV cable', 'Terraza para compartir', 'Baño equipado'],
            precios: [['9 a 12 personas', '$125.000']],
            desde: '$125.000',
        },
    }

    const modalCabana = document.getElementById('modalCabana')
    const cuerpoModalCabana = document.getElementById('cuerpoModalCabana')
    const tituloModalCabana = document.getElementById('tituloModalCabana')
    const subtituloModalCabana = document.getElementById('subtituloModalCabana')

    const pintarCabana = (clave) => {
        const datos = CABANAS[clave] || CABANAS.pequena
        if (!cuerpoModalCabana) return

        tituloModalCabana.textContent = datos.nombre
        subtituloModalCabana.textContent = `Capacidad para ${datos.capacidad}`

        const filasPrecio = datos.precios
            .map(
                ([huespedes, valor]) =>
                    `<tr><td>${huespedes}</td><td>${valor}</td></tr>`
            )
            .join('')

        const listaIncluye = datos.incluye
            .map((item) => `<li><i class="bi bi-check-circle-fill" aria-hidden="true"></i> ${item}</li>`)
            .join('')

        cuerpoModalCabana.innerHTML = `
            <div class="row g-4 align-items-center">
                <div class="col-md-6">
                    <div class="cabana-detalle-img">
                        <img src="${datos.imagen}" alt="${datos.alt}" loading="lazy">
                    </div>
                </div>
                <div class="col-md-6">
                    <h4>Desde ${datos.desde} la noche</h4>
                    <p>${datos.descripcion}</p>
                    <h5>Valores por noche</h5>
                    <table class="tabla-cabana">
                        <thead>
                            <tr><th>Huéspedes</th><th>Precio</th></tr>
                        </thead>
                        <tbody>${filasPrecio}</tbody>
                    </table>
                </div>
            </div>

            <h5>Incluye</h5>
            <ul class="lista-incluye">${listaIncluye}</ul>

            <p class="p-mediano mt-3 mb-0">
                Reserva confirmada con el 30% del valor total. Niños mayores de 2 años pagan su estadía;
                solo un menor de 2 años es gratis. Consulta disponibilidad según temporada.
            </p>
        `
    }

    modalCabana?.addEventListener('show.bs.modal', (evento) => {
        const clave = evento.relatedTarget?.getAttribute('data-cabana') || 'pequena'
        pintarCabana(clave)
    })

    // ============================================================
    // 11. UBICACIÓN: copiar dirección al portapapeles
    // ============================================================
    const btnCopiar = document.getElementById('btnCopiarDireccion')
    const avisoCopiado = document.getElementById('avisoCopiado')

    const mostrarAviso = (elemento, mensaje) => {
        if (!elemento) return
        if (mensaje) elemento.innerHTML = `<i class="bi bi-check-circle-fill" aria-hidden="true"></i> ${mensaje}`
        elemento.classList.add('visible')
        window.clearTimeout(elemento._temporizador)
        elemento._temporizador = window.setTimeout(() => elemento.classList.remove('visible'), 2600)
    }

    btnCopiar?.addEventListener('click', async () => {
        const direccion = btnCopiar.dataset.direccion || ''
        try {
            await navigator.clipboard.writeText(direccion)
        } catch (error) {
            // Alternativa para navegadores sin permiso de portapapeles
            const area = document.createElement('textarea')
            area.value = direccion
            area.setAttribute('readonly', '')
            area.style.position = 'absolute'
            area.style.left = '-9999px'
            document.body.appendChild(area)
            area.select()
            document.execCommand('copy')
            document.body.removeChild(area)
        }
        mostrarAviso(avisoCopiado, 'Dirección copiada')
    })

    // ============================================================
    // 12. FORMULARIO DE CONSULTA (arma un correo con los datos)
    // ============================================================
    const formulario = document.getElementById('formConsulta')
    const avisoConsulta = document.getElementById('avisoConsulta')

    formulario?.addEventListener('submit', (evento) => {
        evento.preventDefault()

        const datos = new FormData(formulario)
        const nombre = (datos.get('nombre') || '').toString().trim()
        const fechas = (datos.get('fechas') || '').toString().trim()
        const personas = (datos.get('personas') || '').toString().trim()
        const cabana = (datos.get('cabana') || '').toString().trim()
        const mensaje = (datos.get('mensaje') || '').toString().trim()

        if (!nombre || !fechas) {
            mostrarAviso(avisoConsulta, 'Completa tu nombre y las fechas para continuar')
            return
        }

        const cuerpo = [
            `Nombre: ${nombre}`,
            `Fechas de la estadía: ${fechas}`,
            personas ? `Cantidad de personas: ${personas}` : null,
            cabana ? `Alojamiento de interés: ${cabana}` : null,
            mensaje ? `\nMensaje:\n${mensaje}` : null,
            '',
            'Consulta enviada desde el sitio web de Cabañas Relmu.',
        ]
            .filter((linea) => linea !== null)
            .join('\n')

        const enlaceCorreo =
            `mailto:info@relmu.com?subject=${encodeURIComponent('Consulta de reserva - Cabañas Relmu')}` +
            `&body=${encodeURIComponent(cuerpo)}`

        mostrarAviso(avisoConsulta, 'Se abrirá tu correo con la consulta lista para enviar')
        window.location.href = enlaceCorreo
    })

    // ============================================================
    // 13. AÑO DEL COPYRIGHT EN EL FOOTER
    // ============================================================
    document.querySelectorAll('[data-anio]').forEach((elemento) => {
        elemento.dataset.anio = String(new Date().getFullYear())
    })
