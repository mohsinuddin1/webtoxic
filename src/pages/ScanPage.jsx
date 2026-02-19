import { useRef, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import { supabase } from '../lib/supabase'
import { analyzeProductImage } from '../lib/gemini'
import { ArrowLeft, Camera, Zap, X, ImageUp } from 'lucide-react'

const SCAN_MODES = ['Item', 'Ingredient']

export default function ScanPage() {
    const navigate = useNavigate()
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const fileInputRef = useRef(null)
    const streamRef = useRef(null)
    const [activeMode, setActiveMode] = useState('Ingredient')
    const [isCameraActive, setIsCameraActive] = useState(false)
    const [capturedImage, setCapturedImage] = useState(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [error, setError] = useState('')
    const { user, incrementScan, saveScan, getRemainingScans, profile } = useStore()

    // Start camera: get stream, then let useEffect attach it to video
    const startCamera = useCallback(async () => {
        try {
            setError('')
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            })
            streamRef.current = stream
            setIsCameraActive(true)
        } catch (err) {
            setError('Camera access denied. Please enable camera permissions.')
        }
    }, [])

    // Attach stream to video element after React renders it
    useEffect(() => {
        if (isCameraActive && streamRef.current && videoRef.current) {
            const video = videoRef.current
            video.srcObject = streamRef.current
            video.onloadedmetadata = () => {
                video.play().catch(() => { })
            }
        }
    }, [isCameraActive])

    // Auto-start camera when page opens
    useEffect(() => {
        startCamera()
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop())
                streamRef.current = null
            }
        }
    }, [])

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

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file.')
            return
        }

        // Validate file size (max 10MB)
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

        // Reset file input so same file can be selected again
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
        startCamera()
    }

    const analyzeImage = async () => {
        if (!capturedImage) return
        setIsAnalyzing(true)
        setError('')

        try {
            // Extract base64 data
            const base64 = capturedImage.split(',')[1]

            // Upload to Supabase Storage (non-blocking — won't break analysis if storage isn't set up)
            let imageUrl = null
            if (user) {
                try {
                    console.log('Starting upload for user:', user.id)
                    const fileName = `${user.id}/${Date.now()}.jpg`

                    // Create a timeout promise (15s)
                    const uploadTimeout = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Upload timed out')), 15000)
                    )

                    // The actual upload promise
                    const uploadPromise = supabase.storage
                        .from('product-scans')
                        .upload(fileName, dataURLtoBlob(capturedImage), {
                            contentType: 'image/jpeg',
                            upsert: true
                        })

                    // Race them
                    const { data: uploadData, error: uploadError } = await Promise.race([uploadPromise, uploadTimeout])

                    if (uploadError) throw uploadError

                    if (uploadData) {
                        const { data: urlData } = supabase.storage
                            .from('product-scans')
                            .getPublicUrl(fileName)
                        imageUrl = urlData?.publicUrl
                    }
                    console.log('Supabase Upload Status:', imageUrl ? 'SUCCESS' : 'FAILED', imageUrl)
                } catch (uploadErr) {
                    console.warn('Image upload failed (non-critical):', uploadErr)
                    // No alert to avoid interrupting user flow
                }
            } else {
                console.log('Skipping upload: User not logged in')
            }

            // Analyze with Gemini (pass scan mode for tailored prompt)
            const result = await analyzeProductImage(base64, activeMode)
            // console.log('Gemini Analysis Result:', result)

            // Save scan to database (with timeout to prevent hanging)
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
                    setTimeout(() => reject(new Error('Save timed out')), 3000)
                )

                savedScan = await Promise.race([savePromise(), timeoutPromise])
            } catch (saveErr) {
                console.warn('Scan save failed/timed out (non-critical):', saveErr)
            }

            console.log('Navigating to result...')

            // Navigate to result
            if (savedScan) {
                navigate(`/result/${savedScan.id}`, {
                    state: { result, imageUrl, scanId: savedScan.id },
                })
            } else {
                navigate('/result/temp', {
                    state: { result, imageUrl },
                })
            }
        } catch (err) {
            console.error('Analysis error:', err)
            setError(err.message || 'Analysis failed. Please try again.')
        } finally {
            setIsAnalyzing(false)
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
                        navigate(-1)
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
            <div className="px-5 mb-4">
                <h1 className="text-display text-2xl mb-1">
                    {capturedImage ? 'Review your scan' : 'Make your scan'}
                </h1>
                <p className="text-text-secondary text-sm">
                    {capturedImage
                        ? 'Check framing and tap Analyze to continue'
                        : 'Snap a picture of a product or its label to analyze'}
                </p>
            </div>

            {/* Camera / Preview Area */}
            <div className="flex-1 px-5 mb-4">
                <div className="relative w-full aspect-[3/4] rounded-[1.5rem] overflow-hidden bg-black">
                    {/* Video element — ALWAYS in DOM, visibility controlled via CSS */}
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

                    {/* Loading state — camera is starting up */}
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

                    {/* Error state — camera denied */}
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
                            {/* Corner brackets */}
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
                                onClick={() => setActiveMode(mode)}
                                className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${activeMode === mode
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-text-muted'
                                    }`}
                            >
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

                {/* Show error message if analysis failed */}
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
            {/* Hidden file input for gallery upload */}
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
