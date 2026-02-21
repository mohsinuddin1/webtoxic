import { useRef, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import { supabase } from '../lib/supabase'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { DecodeHintType, BarcodeFormat } from '@zxing/library'
import { ArrowLeft, Camera, Zap, X, ImageUp, ScanBarcode, Package, Tag, Keyboard, Flashlight, FlashlightOff } from 'lucide-react'

const SCAN_MODES = ['Barcode', 'Item', 'Ingredient']

export default function ScanPage() {
    const navigate = useNavigate()
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const fileInputRef = useRef(null)
    const streamRef = useRef(null)
    const barcodeInputRef = useRef(null)
    const barcodeVideoRef = useRef(null)
    const barcodeReaderRef = useRef(null)
    const barcodeControlsRef = useRef(null)

    // Category selection state
    const [selectedCategory, setSelectedCategory] = useState(null) // 'food' | 'cosmetics'

    const [activeMode, setActiveMode] = useState('Ingredient')
    const [isCameraActive, setIsCameraActive] = useState(false)
    const [capturedImage, setCapturedImage] = useState(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [error, setError] = useState('')
    const [barcodeValue, setBarcodeValue] = useState('')
    const [analyzeSteps, setAnalyzeSteps] = useState([])
    const [isBarcodeScanning, setIsBarcodeScanning] = useState(false)
    const [showManualEntry, setShowManualEntry] = useState(false)
    const [barcodeDetected, setBarcodeDetected] = useState(false)
    const [scanEngine, setScanEngine] = useState(null) // 'native' | 'zxing'
    const [torchOn, setTorchOn] = useState(false)

    const { user, incrementScan, saveScan, getRemainingScans, profile } = useStore()

    // Start camera
    const startCamera = useCallback(async () => {
        try {
            setError('')
            // Stop any existing stream first
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop())
                streamRef.current = null
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            })
            streamRef.current = stream
            setIsCameraActive(true)

            // Immediately try to attach to video element
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(() => { })
                }
            }
        } catch (err) {
            setError('Camera access denied. Please enable camera permissions.')
        }
    }, [])

    // Attach stream to video element whenever either becomes available
    useEffect(() => {
        if (isCameraActive && streamRef.current && videoRef.current) {
            // Only attach if not already attached
            if (videoRef.current.srcObject !== streamRef.current) {
                videoRef.current.srcObject = streamRef.current
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(() => { })
                }
            }
        }
    })

    // Auto-start camera when category is selected and mode is not barcode
    useEffect(() => {
        if (selectedCategory && activeMode !== 'Barcode') {
            // Stop barcode scanner first if it was running (releases camera)
            if (barcodeControlsRef.current) {
                barcodeControlsRef.current.stop()
                barcodeControlsRef.current = null
                setIsBarcodeScanning(false)
            }
            // Small delay ensures barcode scanner fully released the camera
            const timer = setTimeout(() => startCamera(), 150)
            return () => {
                clearTimeout(timer)
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop())
                    streamRef.current = null
                }
                setIsCameraActive(false)
            }
        }
    }, [selectedCategory, activeMode])

    // ================================================================
    // BARCODE SCANNER — Native BarcodeDetector (fast) + zxing fallback
    // ================================================================
    const barcodeDetectedRef = useRef(false)
    const barcodeStreamRef = useRef(null)
    const scanLoopRef = useRef(null)
    const lastScanTimeRef = useRef(0)
    const SCAN_INTERVAL_MS = 66 // ~15fps — optimal balance of speed vs battery

    // Haptic feedback on barcode detection
    const triggerHaptic = useCallback(() => {
        try {
            if (navigator.vibrate) navigator.vibrate([50, 30, 50])
        } catch (_) { /* vibration not supported */ }
    }, [])

    // Audio beep on barcode detection
    const playScanBeep = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = 'sine'
            osc.frequency.setValueAtTime(1200, ctx.currentTime)
            osc.frequency.setValueAtTime(1600, ctx.currentTime + 0.08)
            gain.gain.setValueAtTime(0.15, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
            osc.start(ctx.currentTime)
            osc.stop(ctx.currentTime + 0.2)
        } catch (_) { /* audio not supported */ }
    }, [])

    // Toggle torch/flashlight
    const toggleTorch = useCallback(async () => {
        const stream = barcodeStreamRef.current
        if (!stream) return
        const track = stream.getVideoTracks()[0]
        if (!track) return
        try {
            const capabilities = track.getCapabilities?.()
            if (capabilities?.torch) {
                const newState = !torchOn
                await track.applyConstraints({ advanced: [{ torch: newState }] })
                setTorchOn(newState)
            }
        } catch (_) { /* torch not supported on this device */ }
    }, [torchOn])

    const stopBarcodeScanner = useCallback(() => {
        // Stop scan loop
        if (scanLoopRef.current) {
            cancelAnimationFrame(scanLoopRef.current)
            scanLoopRef.current = null
        }
        // Stop zxing controls if using fallback
        if (barcodeControlsRef.current) {
            barcodeControlsRef.current.stop()
            barcodeControlsRef.current = null
        }
        // Release camera stream
        if (barcodeStreamRef.current) {
            barcodeStreamRef.current.getTracks().forEach(t => t.stop())
            barcodeStreamRef.current = null
        }
        setIsBarcodeScanning(false)
        setTorchOn(false)
        setScanEngine(null)
    }, [])

    const startBarcodeScanner = useCallback(async () => {
        if (!barcodeVideoRef.current) return
        try {
            setError('')
            setIsBarcodeScanning(true)
            setBarcodeDetected(false)
            barcodeDetectedRef.current = false

            // Check native BarcodeDetector with format validation
            let useNative = false
            if ('BarcodeDetector' in window) {
                try {
                    const supported = await window.BarcodeDetector.getSupportedFormats()
                    // Need at least EAN-13 or UPC-A for product barcodes
                    useNative = supported.includes('ean_13') || supported.includes('upc_a')
                    if (!useNative) {
                        console.log('Native BarcodeDetector exists but lacks product barcode formats:', supported)
                    }
                } catch (_) {
                    console.log('getSupportedFormats() failed, testing native detector directly')
                    useNative = true // assume it works, fallback on error
                }
            }

            if (useNative) {
                // ── NATIVE PATH: Hardware-accelerated (~20-50ms per detect) ──
                console.log('⚡ Using native BarcodeDetector (fast)')
                setScanEngine('native')
                const detector = new window.BarcodeDetector({
                    formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'qr_code']
                })

                // Open camera with HD + autofocus
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        focusMode: { ideal: 'continuous' },
                    }
                })
                barcodeStreamRef.current = stream
                barcodeVideoRef.current.srcObject = stream
                await barcodeVideoRef.current.play()

                // Throttled scan loop — ~15fps to save CPU/battery
                const scanLoop = async (timestamp) => {
                    if (barcodeDetectedRef.current) return

                    // Throttle: skip frame if too soon
                    if (timestamp - lastScanTimeRef.current < SCAN_INTERVAL_MS) {
                        scanLoopRef.current = requestAnimationFrame(scanLoop)
                        return
                    }
                    lastScanTimeRef.current = timestamp

                    try {
                        // Guard: video must have enough data loaded
                        if (barcodeVideoRef.current?.readyState >= 2) {
                            const barcodes = await detector.detect(barcodeVideoRef.current)
                            if (barcodes.length > 0 && !barcodeDetectedRef.current) {
                                const code = barcodes[0].rawValue
                                console.log('⚡ Barcode detected (native):', code)
                                barcodeDetectedRef.current = true
                                setBarcodeValue(code)
                                setBarcodeDetected(true)
                                setIsBarcodeScanning(false)
                                // Haptic + audio feedback
                                triggerHaptic()
                                playScanBeep()
                                // Release camera
                                if (barcodeStreamRef.current) {
                                    barcodeStreamRef.current.getTracks().forEach(t => t.stop())
                                    barcodeStreamRef.current = null
                                }
                                setTorchOn(false)
                                return
                            }
                        }
                    } catch (e) {
                        // Frame not ready or detector error, continue
                    }
                    scanLoopRef.current = requestAnimationFrame(scanLoop)
                }
                scanLoopRef.current = requestAnimationFrame(scanLoop)

            } else {
                // ── FALLBACK: @zxing/browser (slower, ~500ms-2s) ──
                console.log('📦 Using @zxing/browser fallback (no native BarcodeDetector)')
                setScanEngine('zxing')
                const hints = new Map()
                hints.set(DecodeHintType.POSSIBLE_FORMATS, [
                    BarcodeFormat.EAN_13,
                    BarcodeFormat.EAN_8,
                    BarcodeFormat.UPC_A,
                    BarcodeFormat.UPC_E,
                    BarcodeFormat.CODE_128,
                    BarcodeFormat.CODE_39,
                    BarcodeFormat.ITF,
                    BarcodeFormat.QR_CODE,
                ])
                hints.set(DecodeHintType.TRY_HARDER, true)

                const reader = new BrowserMultiFormatReader(hints)
                barcodeReaderRef.current = reader

                const constraints = {
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    }
                }

                const controls = await reader.decodeFromConstraints(
                    constraints,
                    barcodeVideoRef.current,
                    (result, err) => {
                        if (result && !barcodeDetectedRef.current) {
                            const code = result.getText()
                            console.log('📦 Barcode detected (zxing):', code)
                            barcodeDetectedRef.current = true
                            setBarcodeValue(code)
                            setBarcodeDetected(true)
                            // Haptic + audio feedback
                            triggerHaptic()
                            playScanBeep()
                            if (barcodeControlsRef.current) {
                                barcodeControlsRef.current.stop()
                            }
                            setIsBarcodeScanning(false)
                        }
                    }
                )
                barcodeControlsRef.current = controls
            }
        } catch (err) {
            console.error('Barcode scanner error:', err)
            setError('Camera access denied. Use manual entry instead.')
            setShowManualEntry(true)
            setIsBarcodeScanning(false)
        }
    }, [triggerHaptic, playScanBeep])

    // Auto-start barcode scanner when mode is Barcode
    useEffect(() => {
        if (selectedCategory && activeMode === 'Barcode' && !showManualEntry && !barcodeDetected) {
            // Small delay to ensure video element is mounted
            const timer = setTimeout(() => startBarcodeScanner(), 300)
            return () => {
                clearTimeout(timer)
                stopBarcodeScanner()
            }
        }
        return () => stopBarcodeScanner()
    }, [selectedCategory, activeMode, showManualEntry, barcodeDetected])

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
        setIsCameraActive(false)
    }, [])

    // Upload image from gallery
    const handleUpload = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file.')
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('Image too large. Maximum 10MB allowed.')
            return
        }
        const reader = new FileReader()
        reader.onload = (event) => {
            setCapturedImage(event.target.result)
            stopCamera()
            setError('')
        }
        reader.onerror = () => {
            setError('Failed to read image file.')
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    const captureImage = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return
        const video = videoRef.current
        const canvas = canvasRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedImage(imageData)
        stopCamera()
    }, [stopCamera])

    const retake = () => {
        setCapturedImage(null)
        setError('')
        if (activeMode !== 'Barcode') {
            startCamera()
        }
    }

    function dataURLtoBlob(dataURL) {
        const arr = dataURL.split(',')
        const mime = arr[0].match(/:(.*?);/)[1]
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n--) u8arr[n] = bstr.charCodeAt(n)
        return new Blob([u8arr], { type: mime })
    }

    // ============ BARCODE FLOW ============
    const handleBarcodeScan = async () => {
        if (!barcodeValue.trim()) {
            setError('Please enter a barcode number.')
            return
        }

        setIsAnalyzing(true)
        setError('')
        setAnalyzeSteps(['Looking up product...'])

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('No active session')

            setAnalyzeSteps(['Looking up product...', 'Calling product database...'])

            const { data: result, error: fnError } = await supabase.functions.invoke('scan-barcode', {
                body: { barcode: barcodeValue.trim(), category: selectedCategory }
            })

            if (fnError) throw new Error(fnError.message || 'Barcode lookup failed.')

            // Check if fallback is needed
            if (result?.fallback) {
                setError(result.message || 'Product not found. Please use the Ingredient method.')
                setIsAnalyzing(false)
                return
            }

            if (result?.error && !result?.overallGrade) {
                setError(result.message || result.error || 'Analysis failed.')
                setIsAnalyzing(false)
                return
            }

            setAnalyzeSteps(['Looking up product...', 'Calling product database...', 'Classifying ingredients...', 'Done!'])

            // Save scan
            let savedScan = null
            try {
                const scanData = {
                    imageUrl: null,
                    productName: result.productName || 'Unknown Product',
                    ingredients: result.ingredients || [],
                    harmfulChemicals: result.harmfulChemicals || [],
                    grade: result.overallGrade || 'C',
                    score: result.toxicityScore || 50,
                }
                const saved = await saveScan(scanData)
                await incrementScan()
                savedScan = saved
            } catch (saveErr) {
                console.warn('Scan save failed:', saveErr)
            }

            if (savedScan) {
                navigate(`/result/${savedScan.id}`, { state: { result, scanId: savedScan.id } })
            } else {
                navigate('/result/temp', { state: { result } })
            }

        } catch (err) {
            console.error('Barcode scan error:', err)
            setError(err.message || 'Barcode scan failed. Please try the Ingredient method.')
        } finally {
            setIsAnalyzing(false)
            setAnalyzeSteps([])
        }
    }

    // ============ IMAGE FLOW (Item & Ingredient) ============
    const analyzeImage = async () => {
        if (!capturedImage) return
        setIsAnalyzing(true)
        setError('')

        try {
            // Upload to Supabase Storage
            let imageUrl = null
            let currentUser = user
            try {
                const sessionPromise = supabase.auth.getUser()
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Auth check timeout')), 5000)
                )
                const { data: { user: sessionUser }, error: sessionError } = await Promise.race([sessionPromise, timeoutPromise])
                if (!sessionError && sessionUser) currentUser = sessionUser
            } catch (authErr) {
                console.warn('Auth check failed, using store user:', authErr)
            }

            if (currentUser) {
                try {
                    const fileName = `${currentUser.id}/${Date.now()}.jpg`
                    const blob = dataURLtoBlob(capturedImage)

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('product-scans')
                        .upload(fileName, blob, {
                            contentType: 'image/jpeg',
                            upsert: true
                        })

                    if (uploadError) throw uploadError

                    if (uploadData) {
                        const { data: urlData } = supabase.storage
                            .from('product-scans')
                            .getPublicUrl(fileName)
                        imageUrl = urlData?.publicUrl
                    }
                } catch (uploadErr) {
                    console.warn('Image upload failed (continuing with base64 fallback):', uploadErr)
                }
            }

            // Call Edge Function
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('No active session for analysis')

            const { data: result, error: functionError } = await supabase.functions.invoke('analyze-scanFinal', {
                body: {
                    imageUrl,
                    imageBase64: imageUrl ? null : capturedImage,
                    scanMode: activeMode,
                    category: selectedCategory
                }
            })

            if (functionError) throw new Error('Analysis failed at server level.')

            // Save scan
            let savedScan = null
            try {
                const scanData = {
                    imageUrl,
                    productName: result.productName || 'Unknown Product',
                    ingredients: result.ingredients || [],
                    harmfulChemicals: result.harmfulChemicals || [],
                    grade: result.overallGrade || 'C',
                    score: result.toxicityScore || 50,
                }
                const savePromise = async () => {
                    const saved = await saveScan(scanData)
                    await incrementScan()
                    return saved
                }
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('DB Save timed out')), 10000)
                )
                savedScan = await Promise.race([savePromise(), timeoutPromise])
            } catch (saveErr) {
                console.warn('Scan save failed/timed out:', saveErr)
            }

            if (savedScan) {
                navigate(`/result/${savedScan.id}`, { state: { result, imageUrl, scanId: savedScan.id } })
            } else {
                navigate('/result/temp', { state: { result, imageUrl } })
            }
        } catch (err) {
            console.error('Analysis error:', err)
            setError(err.message || 'Analysis failed. Please try again.')
        } finally {
            setIsAnalyzing(false)
        }
    }

    // ============ CATEGORY SELECTION SCREEN ============
    if (!selectedCategory) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-dvh bg-white flex flex-col"
            >
                {/* Top Bar */}
                <div className="flex items-center justify-between px-4 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="inline-flex items-center gap-1.5">
                        <span className="text-base">☣️</span>
                        <span className="text-brand text-sm tracking-[0.15em]">
                            PURE<span className="text-accent">SCAN</span>
                        </span>
                    </div>
                    <div className="w-10" />
                </div>

                {/* Title */}
                <div className="px-5 mb-8">
                    <h1 className="text-display text-2xl mb-1">What are you scanning?</h1>
                    <p className="text-text-secondary text-sm">
                        Select a category to get started
                    </p>
                </div>

                {/* Category Cards */}
                <div className="flex-1 px-5 space-y-4">
                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedCategory('food')}
                        className="w-full p-6 rounded-[1.5rem] bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100 text-left transition-all hover:border-green-300 active:bg-green-100"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center text-3xl">
                                🍎
                            </div>
                            <div>
                                <h3 className="text-display text-lg">Food</h3>
                                <p className="text-text-secondary text-sm mt-0.5">
                                    Scan food products, snacks, beverages
                                </p>
                            </div>
                        </div>
                    </motion.button>

                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedCategory('cosmetics')}
                        className="w-full p-6 rounded-[1.5rem] bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100 text-left transition-all hover:border-purple-300 active:bg-purple-100"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-3xl">
                                🧴
                            </div>
                            <div>
                                <h3 className="text-display text-lg">Cosmetics</h3>
                                <p className="text-text-secondary text-sm mt-0.5">
                                    Scan skincare, makeup, beauty products
                                </p>
                            </div>
                        </div>
                    </motion.button>
                </div>

                {/* Remaining Scans */}
                {!profile?.is_pro && (
                    <p className="text-center text-text-muted text-sm py-6">
                        {getRemainingScans()}/3 Free Scans Left
                    </p>
                )}
            </motion.div>
        )
    }

    // ============ BARCODE MODE UI ============
    if (activeMode === 'Barcode') {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-dvh bg-white flex flex-col"
            >
                {/* Top Bar */}
                <div className="flex items-center justify-between px-4 py-4">
                    <button
                        onClick={() => {
                            stopCamera()
                            stopBarcodeScanner()
                            setSelectedCategory(null)
                            setActiveMode('Ingredient')
                            setBarcodeValue('')
                            setBarcodeDetected(false)
                            setShowManualEntry(false)
                        }}
                        className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="inline-flex items-center gap-1.5">
                        <span className="text-base">☣️</span>
                        <span className="text-brand text-sm tracking-[0.15em]">
                            PURE<span className="text-accent">SCAN</span>
                        </span>
                    </div>
                    <div className="w-10" />
                </div>

                {/* Title */}
                <div className="px-5 mb-2">
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-display text-2xl">Scan Barcode</h1>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${selectedCategory === 'cosmetics'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-100 text-green-700'
                            }`}>
                            {selectedCategory === 'cosmetics' ? '🧴' : '🍎'}
                        </span>
                    </div>
                    <p className="text-text-secondary text-sm">
                        {showManualEntry
                            ? 'Type the barcode number manually'
                            : barcodeDetected
                                ? `Barcode detected: ${barcodeValue}`
                                : 'Point your camera at the barcode'}
                    </p>
                </div>

                {/* Camera Scanner / Manual Entry */}
                <div className="flex-1 px-5 mb-4">
                    {!showManualEntry && !barcodeDetected ? (
                        /* Live Camera Barcode Scanner */
                        <div className="relative w-full aspect-[3/4] rounded-[1.5rem] overflow-hidden bg-black">
                            <video
                                ref={barcodeVideoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    objectFit: 'cover',
                                    width: '100%',
                                    height: '100%',
                                }}
                            />

                            {/* Scan engine badge */}
                            {isBarcodeScanning && scanEngine && (
                                <div className="absolute top-3 left-3 z-10">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider backdrop-blur-md ${scanEngine === 'native'
                                            ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                                            : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                                        }`}>
                                        {scanEngine === 'native' ? '⚡ NATIVE' : '📦 ZXING'}
                                    </span>
                                </div>
                            )}

                            {/* Torch toggle button */}
                            {isBarcodeScanning && (
                                <button
                                    onClick={toggleTorch}
                                    className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all"
                                    style={{
                                        backgroundColor: torchOn ? 'rgba(250, 204, 21, 0.3)' : 'rgba(0,0,0,0.4)',
                                        border: torchOn ? '1px solid rgba(250, 204, 21, 0.5)' : '1px solid rgba(255,255,255,0.2)',
                                    }}
                                >
                                    {torchOn
                                        ? <Flashlight size={16} className="text-yellow-300" />
                                        : <FlashlightOff size={16} className="text-white/70" />
                                    }
                                </button>
                            )}

                            {/* Scan line animation */}
                            {isBarcodeScanning && (
                                <>
                                    {/* Corner brackets */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute top-6 left-6 w-12 h-12 border-t-3 border-l-3 border-white/80 rounded-tl-lg" />
                                        <div className="absolute top-6 right-6 w-12 h-12 border-t-3 border-r-3 border-white/80 rounded-tr-lg" />
                                        <div className="absolute bottom-6 left-6 w-12 h-12 border-b-3 border-l-3 border-white/80 rounded-bl-lg" />
                                        <div className="absolute bottom-6 right-6 w-12 h-12 border-b-3 border-r-3 border-white/80 rounded-br-lg" />
                                    </div>

                                    {/* Scanning laser line */}
                                    <motion.div
                                        initial={{ top: '15%' }}
                                        animate={{ top: ['15%', '85%', '15%'] }}
                                        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                                        className="absolute left-8 right-8 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                                    />
                                </>
                            )}

                            {/* Loading overlay if not yet scanning */}
                            {!isBarcodeScanning && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-muted">
                                    <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                    <p className="text-text-secondary text-sm">Opening camera...</p>
                                </div>
                            )}
                        </div>
                    ) : barcodeDetected && !showManualEntry ? (
                        /* Barcode Detected State */
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-surface-elevated rounded-[var(--radius-card)] p-6 border border-green-200 text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
                            >
                                <ScanBarcode size={28} className="text-green-600" />
                            </motion.div>
                            <h3 className="font-bold text-lg mb-1">Barcode Detected!</h3>
                            <p className="text-text-secondary text-sm mb-3">Code: <span className="font-mono font-bold tracking-widest">{barcodeValue}</span></p>
                            <button
                                onClick={() => {
                                    setBarcodeDetected(false)
                                    setBarcodeValue('')
                                }}
                                className="text-primary text-sm font-medium underline"
                            >
                                Scan again
                            </button>
                        </motion.div>
                    ) : (
                        /* Manual Entry */
                        <div className="bg-surface-elevated rounded-[var(--radius-card)] p-5 border border-border-light">
                            <div className="flex items-center gap-3 mb-4">
                                <Keyboard size={24} className="text-primary" />
                                <h3 className="font-semibold text-sm">Enter Barcode Manually</h3>
                            </div>
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="e.g. 737628064502"
                                value={barcodeValue}
                                onChange={(e) => {
                                    setBarcodeValue(e.target.value.replace(/[^0-9]/g, ''))
                                    setBarcodeDetected(false)
                                }}
                                className="w-full px-4 py-3.5 bg-surface-muted rounded-xl text-base font-mono outline-none focus:ring-2 focus:ring-primary/20 transition-all text-center tracking-widest"
                                autoFocus
                            />
                            <p className="text-text-muted text-xs mt-3 text-center">
                                Usually found at the bottom or back of the product packaging
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                        >
                            <p className="text-danger text-sm text-center font-medium">{error}</p>
                        </motion.div>
                    )}
                </div>

                {/* Toggle: Camera <-> Manual entry */}
                {!isAnalyzing && (
                    <div className="px-5 mb-3">
                        <button
                            onClick={() => {
                                if (showManualEntry) {
                                    setShowManualEntry(false)
                                    setBarcodeDetected(false)
                                    setBarcodeValue('')
                                } else {
                                    stopBarcodeScanner()
                                    setShowManualEntry(true)
                                }
                            }}
                            className="w-full py-2.5 text-sm font-medium text-primary flex items-center justify-center gap-2"
                        >
                            {showManualEntry ? (
                                <><Camera size={16} /> Switch to Camera Scanner</>
                            ) : (
                                <><Keyboard size={16} /> Enter Manually Instead</>
                            )}
                        </button>
                    </div>
                )}

                {/* Mode Toggle */}
                <div className="px-5 mb-4">
                    <div className="flex gap-1 p-1 bg-surface-muted rounded-full">
                        {SCAN_MODES.map((mode) => (
                            <button
                                key={mode}
                                onClick={() => {
                                    stopBarcodeScanner()
                                    setActiveMode(mode)
                                    setError('')
                                    setBarcodeValue('')
                                    setBarcodeDetected(false)
                                    setShowManualEntry(false)
                                }}
                                className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${activeMode === mode
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-text-muted'
                                    }`}
                            >
                                {mode === 'Barcode' && '📊 '}
                                {mode === 'Item' && '📦 '}
                                {mode === 'Ingredient' && '🏷️ '}
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action */}
                <div className="px-5 pb-8">
                    {!isAnalyzing ? (
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleBarcodeScan}
                            disabled={!barcodeValue.trim()}
                            className={`w-full py-4 rounded-[var(--radius-button)] font-semibold text-[15px] flex items-center justify-center gap-2 transition-all ${barcodeValue.trim()
                                ? 'bg-primary text-white'
                                : 'bg-surface-muted text-text-muted cursor-not-allowed'
                                }`}
                        >
                            <ScanBarcode size={18} />
                            {barcodeDetected ? 'Look Up Product' : 'Look Up Product'}
                        </motion.button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center"
                        >
                            <div className="w-full py-4 bg-primary/10 text-primary rounded-[var(--radius-button)] font-semibold text-[15px] flex items-center justify-center gap-3">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                    className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full"
                                />
                                Searching...
                            </div>
                            <div className="mt-4 space-y-2">
                                {analyzeSteps.map((step, i) => (
                                    <motion.div
                                        key={step}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.3 }}
                                        className="flex items-center gap-2 text-sm text-text-secondary justify-center"
                                    >
                                        <Zap size={14} className="text-accent" />
                                        {step}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        )
    }

    // ============ IMAGE MODE UI (Item / Ingredient) ============
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-dvh bg-white flex flex-col"
        >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-4">
                <button
                    onClick={() => {
                        stopCamera()
                        setSelectedCategory(null)
                        setActiveMode('Ingredient')
                    }}
                    className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="inline-flex items-center gap-1.5">
                    <span className="text-base">☣️</span>
                    <span className="text-brand text-sm tracking-[0.15em]">
                        PURE<span className="text-accent">SCAN</span>
                    </span>
                </div>
                <div className="w-10" />
            </div>

            {/* Title */}
            <div className="px-5 mb-2">
                <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-display text-2xl">
                        {capturedImage ? 'Review your scan' : `Scan ${activeMode}`}
                    </h1>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${selectedCategory === 'cosmetics'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                        }`}>
                        {selectedCategory === 'cosmetics' ? '🧴' : '🍎'}
                    </span>
                </div>
                <p className="text-text-secondary text-sm">
                    {capturedImage
                        ? 'Check framing and tap Analyze to continue'
                        : activeMode === 'Item'
                            ? 'Snap a picture of the full product packaging'
                            : 'Snap a picture of the ingredient label'}
                </p>
            </div>

            {/* Camera / Preview Area */}
            <div className="flex-1 px-5 mb-4">
                <div className="relative w-full aspect-[3/4] rounded-[1.5rem] overflow-hidden bg-black">
                    {/* Video element */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        webkit-playsinline="true"
                        style={{
                            objectFit: 'cover',
                            width: '100%',
                            height: '100%',
                            display: (isCameraActive && !capturedImage) ? 'block' : 'none',
                        }}
                    />

                    {/* Loading state */}
                    {!isCameraActive && !capturedImage && !error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-surface-muted"
                        >
                            <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                            <p className="text-text-secondary text-sm">Opening camera...</p>
                        </motion.div>
                    )}

                    {/* Error state */}
                    {!isCameraActive && !capturedImage && error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-surface-muted"
                        >
                            <Camera size={48} className="text-text-muted mb-4" />
                            <p className="text-danger text-sm mb-6 px-4 text-center">{error}</p>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={startCamera}
                                className="px-8 py-3 bg-primary text-white rounded-[var(--radius-button)] font-semibold text-sm"
                            >
                                Try Again
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-3 px-8 py-3 bg-surface-elevated text-text-primary rounded-[var(--radius-button)] font-semibold text-sm border border-border flex items-center gap-2"
                            >
                                <ImageUp size={16} />
                                Upload from Gallery
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Scan Frame Overlay */}
                    {isCameraActive && !capturedImage && (
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-6 left-6 w-12 h-12 border-t-3 border-l-3 border-white/80 rounded-tl-lg" />
                            <div className="absolute top-6 right-6 w-12 h-12 border-t-3 border-r-3 border-white/80 rounded-tr-lg" />
                            <div className="absolute bottom-6 left-6 w-12 h-12 border-b-3 border-l-3 border-white/80 rounded-bl-lg" />
                            <div className="absolute bottom-6 right-6 w-12 h-12 border-b-3 border-r-3 border-white/80 rounded-br-lg" />
                        </div>
                    )}

                    {/* Captured image preview */}
                    {capturedImage && (
                        <motion.img
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            src={capturedImage}
                            alt="Captured"
                            className="w-full h-full object-cover"
                        />
                    )}

                    {capturedImage && !isAnalyzing && (
                        <button
                            onClick={retake}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Mode Toggle */}
            {!capturedImage && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="px-5 mb-4"
                >
                    <div className="flex gap-1 p-1 bg-surface-muted rounded-full">
                        {SCAN_MODES.map((mode) => (
                            <button
                                key={mode}
                                onClick={() => {
                                    setActiveMode(mode)
                                    setError('')
                                }}
                                className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${activeMode === mode
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-text-muted'
                                    }`}
                            >
                                {mode === 'Barcode' && '📊 '}
                                {mode === 'Item' && '📦 '}
                                {mode === 'Ingredient' && '🏷️ '}
                                {mode}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Remaining Scans Info */}
            {!profile?.is_pro && (
                <p className="text-center text-text-muted text-sm mb-3">
                    {getRemainingScans()}/3 Free Scans Left
                </p>
            )}

            {/* Action Buttons */}
            <div className="px-5 pb-8">
                {isCameraActive && !capturedImage && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex gap-3"
                    >
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={captureImage}
                            className="flex-1 py-4 bg-primary text-white rounded-[var(--radius-button)] font-semibold text-[15px] flex items-center justify-center gap-2"
                        >
                            <Camera size={18} />
                            Capture
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="py-4 px-5 bg-surface-muted text-text-primary rounded-[var(--radius-button)] font-semibold text-[15px] flex items-center justify-center gap-2 border border-border"
                        >
                            <ImageUp size={18} />
                            Upload
                        </motion.button>
                    </motion.div>
                )}

                {capturedImage && !isAnalyzing && (
                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={analyzeImage}
                        className="w-full py-4 bg-primary text-white rounded-[var(--radius-button)] font-semibold text-[15px] flex items-center justify-center gap-2"
                    >
                        <span className="text-lg">☣️</span>
                        Start Scanning
                    </motion.button>
                )}

                {isAnalyzing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                    >
                        <div className="w-full py-4 bg-primary/10 text-primary rounded-[var(--radius-button)] font-semibold text-[15px] flex items-center justify-center gap-3">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full"
                            />
                            Analyzing with AI...
                        </div>
                        <div className="mt-4 space-y-2">
                            {['Extracting ingredients', 'Checking for toxins', 'Calculating grade'].map(
                                (step, i) => (
                                    <motion.div
                                        key={step}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 1.2 }}
                                        className="flex items-center gap-2 text-sm text-text-secondary justify-center"
                                    >
                                        <Zap size={14} className="text-accent" />
                                        {step}...
                                    </motion.div>
                                )
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Error message */}
                {!isAnalyzing && error && capturedImage && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                    >
                        <p className="text-danger text-sm text-center font-medium mb-2">{error}</p>
                        <p className="text-text-muted text-xs text-center">
                            Please try again or retake the photo to ensure text is clear.
                        </p>
                    </motion.div>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
            />
        </motion.div>
    )
}
