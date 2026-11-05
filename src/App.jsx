import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Camera, ChevronDown, ChevronRight, Heart, Images, Menu, X } from 'lucide-react'
import { albums, cloudinaryReady, getAlbumPhotos, getAlbumPreviewPhotos, getFeaturedPhotos } from './cloudinary.js'

const PHOTO_BATCH_SIZE = 20

function Photo({ src, alt, className = '', loading = 'lazy' }) {
  return <img className={className} src={src} alt={alt} loading={loading} />
}

function App() {
  const [activeAlbum, setActiveAlbum] = useState(() => albums.find((album) => album.path === window.location.pathname) || null)
  const [photos, setPhotos] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [featured, setFeatured] = useState([])
  const [albumCovers, setAlbumCovers] = useState({})
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const albumRequestRef = useRef(0)
  const loadingMoreRef = useRef(false)

  const ready = cloudinaryReady()

  useEffect(() => {
    let mounted = true
    getFeaturedPhotos().then((items) => { if (mounted) setFeatured(items) })
    getAlbumPreviewPhotos().then((items) => { if (mounted) setAlbumCovers(items) })
    return () => { mounted = false }
  }, [])

  const openAlbum = useCallback(async (album, pushHistory = true) => {
    const requestId = ++albumRequestRef.current
    if (pushHistory && window.location.pathname !== album.path) window.history.pushState({}, '', album.path)
    setActiveAlbum(album)
    setPhotos([])
    setNextCursor(null)
    setLoadingMore(false)
    setError('')
    setLoading(true)
    try {
      const result = await getAlbumPhotos(album.id, { limit: PHOTO_BATCH_SIZE })
      if (requestId !== albumRequestRef.current) return
      setPhotos(result.photos || [])
      setNextCursor(result.nextCursor || null)
      if (!result.photos?.length) setError('Belum ada foto di album ini. Sinkronkan manifest setelah mengunggah foto ke Cloudinary.')
    } catch (cause) {
      if (requestId !== albumRequestRef.current) return
      setError(cause.message || 'Foto belum dapat dimuat. Pastikan manifest foto sudah dibuat.')
    } finally {
      if (requestId === albumRequestRef.current) setLoading(false)
    }
  }, [ready])

  useEffect(() => {
    const syncRoute = () => {
      const album = albums.find((item) => item.path === window.location.pathname) || null
      setSelectedPhoto(null)
      if (album) openAlbum(album, false)
      else {
        albumRequestRef.current += 1
        setActiveAlbum(null)
        setPhotos([])
        setNextCursor(null)
        setError('')
        setLoading(false)
      }
    }
    window.addEventListener('popstate', syncRoute)
    syncRoute()
    return () => window.removeEventListener('popstate', syncRoute)
  }, [openAlbum])

  const closeAlbum = () => {
    albumRequestRef.current += 1
    if (window.location.pathname !== '/') window.history.pushState({}, '', '/')
    setActiveAlbum(null)
    setPhotos([])
    setNextCursor(null)
    setError('')
  }

  const orderedPhotos = useMemo(() => photos, [photos])
  const photoSections = useMemo(() => {
    const sections = []
    for (let index = 0; index < photos.length; index += PHOTO_BATCH_SIZE) {
      sections.push(photos.slice(index, index + PHOTO_BATCH_SIZE))
    }
    return sections
  }, [photos])
  const currentIndex = selectedPhoto ? orderedPhotos.findIndex((photo) => photo.id === selectedPhoto.id) : -1
  const movePhoto = (direction) => {
    if (!orderedPhotos.length || currentIndex < 0) return
    const next = (currentIndex + direction + orderedPhotos.length) % orderedPhotos.length
    setSelectedPhoto(orderedPhotos[next])
  }

  useEffect(() => {
    if (!selectedPhoto) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedPhoto(null)
      if (event.key === 'ArrowLeft') movePhoto(-1)
      if (event.key === 'ArrowRight') movePhoto(1)
    }
    window.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  })

  const loadMorePhotos = async () => {
    if (!activeAlbum || !nextCursor || loadingMoreRef.current) return
    const albumId = activeAlbum.id
    const cursor = nextCursor
    const requestId = albumRequestRef.current
    loadingMoreRef.current = true
    setLoadingMore(true)
    try {
      const result = await getAlbumPhotos(albumId, { limit: PHOTO_BATCH_SIZE, cursor })
      if (requestId !== albumRequestRef.current) return
      setPhotos((current) => [...current, ...(result.photos || [])])
      setNextCursor(result.nextCursor || null)
    } catch (cause) {
      if (requestId === albumRequestRef.current) setError(cause.message || 'Foto berikutnya gagal dimuat.')
    } finally {
      loadingMoreRef.current = false
      if (requestId === albumRequestRef.current) setLoadingMore(false)
    }
  }

  const goToAlbums = () => {
    setMenuOpen(false)
    document.querySelector('#albums')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="/" onClick={(event) => { event.preventDefault(); closeAlbum(); setMenuOpen(false) }} aria-label="Kembali ke beranda">
          <span className="brand-mark">R<span>&</span>H</span>
          <span className="brand-label">THE WEDDING<br />GALLERY</span>
        </a>
        <nav className={menuOpen ? 'nav-links nav-open' : 'nav-links'} aria-label="Navigasi utama">
          <a href="/" onClick={(event) => { event.preventDefault(); closeAlbum(); setMenuOpen(false) }}>Beranda</a>
          <a href="#story" onClick={() => setMenuOpen(false)}>Cerita kami</a>
          <button onClick={goToAlbums}>Album foto</button>
        </nav>
        <button className="nav-cta" onClick={goToAlbums}>Jelajahi galeri <ArrowUpRight size={15} /></button>
        <button className="mobile-menu" aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      {activeAlbum ? (
        <section className="album-view" aria-live="polite">
          <div className="album-topline">
            <button className="back-link" onClick={closeAlbum}><ArrowLeft size={16} /> Semua album</button>
            <span className="eyebrow">{activeAlbum.category}</span>
          </div>
          <div className="album-heading">
            <div><p className="eyebrow">MENGENANG HARI BAHAGIA</p><h1>{activeAlbum.title}</h1></div>
            <p>{activeAlbum.description}</p>
          </div>
          {loading && <div className="status-message"><span className="spinner" /> Memuat foto-foto kenangan…</div>}
          {!loading && error && <div className="empty-state"><Camera size={25} /><h2>{ready ? 'Album belum berisi foto' : 'Galeri sedang disiapkan'}</h2><p>{error}</p></div>}
          {!loading && photos.length > 0 && <>{photoSections.map((section, sectionIndex) => <div className="photo-section" key={`photo-section-${sectionIndex}`}><div className="photo-grid">{section.map((photo, photoIndex) => {
            const index = sectionIndex * PHOTO_BATCH_SIZE + photoIndex
            return <button className="photo-tile" key={photo.id} onClick={() => setSelectedPhoto(photo)} aria-label={`Lihat foto ${index + 1}: ${photo.alt}`}><Photo src={photo.thumb} alt={photo.alt} /><span className="photo-number">{String(index + 1).padStart(2, '0')}</span></button>
          })}</div></div>)}{nextCursor && <div className="load-more-sentinel" aria-live="polite"><button className="load-more-button" type="button" onClick={loadMorePhotos} disabled={loadingMore}>{loadingMore ? <><span className="spinner" /> Memuat foto berikutnya…</> : <>Muat foto lainnya <ChevronRight size={17} /></>}</button></div>}</>}
        </section>
      ) : (
        <>
          <section className="hero" id="home">
            <div className="hero-copy">
              <p className="eyebrow"><span className="eyebrow-line" /> SEBUAH CERITA, SATU PERJALANAN</p>
              <h1>Refdinal <span className="ampersand">&</span><br />Hanum<span className="title-period">.</span></h1>
              <p className="hero-subtitle">Galeri pernikahan</p>
              <div className="hero-rule" />
              <p className="hero-date">21 — 24 Oktober 2026 <span>·</span> Indonesia</p>
              <button className="round-link" onClick={goToAlbums}><span>Jelajahi<br />kenangan</span><ArrowDown size={16} /></button>
            </div>
            <div className="hero-visual">
              <div className="hero-image-frame"><Photo src="https://res.cloudinary.com/h2116g6d/image/upload/f_auto,q_auto,w_1800/AXL_6647.jpg" alt="AXL_6647 — momen pernikahan Refdinal dan Hanum" loading="eager" /></div>
              <div className="photo-index"><span>01</span><i /> 07</div>
              <div className="hero-caption"><span>SEBUAH AWAL YANG INDAH</span><Heart size={14} /></div>
              <div className="image-stamp">R <span>&</span> H</div>
            </div>
            <div className="hero-side-note">21–24 OKTOBER <i /> 2026</div>
            <div className="hero-bottom-note">SCROLL UNTUK MENJELAJAHI <ChevronDown size={13} /></div>
          </section>

          <section className="intro-section" id="story">
            <div className="intro-label"><span>01</span><i /> CERITA KAMI</div>
            <div className="intro-content"><p className="eyebrow">UNTUK SELALU DIKENANG</p><h2>Hari-hari berlalu,<br />kenangan <em>menetap.</em></h2><div className="intro-bottom"><p>Empat hari yang penuh doa, tawa, dan pelukan hangat. Kami merangkai momen-momen kecil ini di sini, agar bisa kita kunjungi lagi kapan saja.</p><span className="signature">Refdinal & Hanum</span></div></div>
            <div className="intro-mark">R<br /><span>&</span><br />H</div>
          </section>

          <section className="featured-section" aria-label="Sorotan kenangan">
            <div className="section-kicker"><span>PILIHAN KENANGAN</span><span>21 — 24 OKTOBER 2026</span></div>
            <div className="featured-grid">
              {featured.slice(0, 6).map((photo, index) => <button className={`featured-photo featured-photo-${index + 1}`} key={photo.id} onClick={() => setSelectedPhoto(photo)} aria-label={`Sorotan foto ${index + 1}`}><Photo src={photo.thumb || photo.src} alt={photo.alt} /><span className="featured-count">{String(index + 1).padStart(2, '0')} <ArrowUpRight size={14} /></span></button>)}
            </div>
          </section>

          <section className="albums-section" id="albums">
            <div className="albums-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> DISIMPAN DENGAN PENUH CINTA</p><h2>Setiap momen,<br /><em>punya ceritanya.</em></h2></div><p className="albums-note">Tujuh sudut pandang,<br />satu hari yang tak terlupakan.</p></div>
            <div className="album-list">{albums.map((album, index) => <button className="album-card" key={album.id} onClick={() => openAlbum(album)}><span className="album-card-index">0{index + 1}</span><span className="album-thumb">{albumCovers[album.id] ? <Photo src={albumCovers[album.id].thumb} alt="" /> : <span className="album-thumb-empty"><Images size={17} /></span>}</span><span className="album-card-copy"><span className="album-category">{album.category}</span><span className="album-title">{album.title}</span></span><span className="album-open"><ArrowUpRight size={18} /></span></button>)}</div>
            {!ready && <p className="setup-hint"><Images size={15} /> Foto album akan tampil setelah Cloudinary disambungkan.</p>}
          </section>

          <section className="closing-section"><div className="closing-image"><Photo src={featured[1]?.src || albumCovers.akad?.src || albums[0].cover} alt="Momen pernikahan Refdinal dan Hanum" /></div><div className="closing-overlay"><p className="eyebrow">DENGAN PENUH RASA SYUKUR</p><h2>Terima kasih telah<br />menjadi bagian <em>dari cerita kami.</em></h2><span className="closing-monogram">R <span>&</span> H</span></div></section>
          <footer className="footer"><a className="footer-brand" href="#home">Refdinal <span>&</span> Hanum</a><span>21 — 24 OKTOBER 2026</span><span>DIBUAT DENGAN <Heart size={12} fill="currentColor" /> PENUH CINTA</span></footer>
        </>
      )}

      {selectedPhoto && <div className="lightbox" role="dialog" aria-modal="true" aria-label="Tampilan foto" onClick={() => setSelectedPhoto(null)}><button className="lightbox-close" onClick={() => setSelectedPhoto(null)} aria-label="Tutup"><X size={23} /></button>{orderedPhotos.length > 1 && <button className="lightbox-arrow lightbox-prev" onClick={(event) => { event.stopPropagation(); movePhoto(-1) }} aria-label="Foto sebelumnya"><ArrowLeft /></button>}<img src={selectedPhoto.src} alt={selectedPhoto.alt} onClick={(event) => event.stopPropagation()} />{orderedPhotos.length > 1 && <button className="lightbox-arrow lightbox-next" onClick={(event) => { event.stopPropagation(); movePhoto(1) }} aria-label="Foto berikutnya"><ArrowRight /></button>}<span className="lightbox-caption">{selectedPhoto.alt}</span></div>}
    </main>
  )
}

export default App
