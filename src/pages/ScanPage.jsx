import { useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import { supabase } from '../lib/supabase'
import { analyzeProductImage } from '../lib/gemini'
import { ArrowLeft, Camera, Zap, X } from 'lucide-react'

const SCAN_MODES = ['Item', 'Label', 'Barcode']

export default function ScanPage() {
    const navigate = useNavigate()
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)
    const [activeMode, setActiveMode] = useState('Label')
    const [isCameraActive, setIsCameraActive] = useState(false)
    const [capturedImage, setCapturedImage] = useState(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [error, setError] = useState('')
    const { user, incrementScan, saveScan, getRemainingScans, profile } = useStore()

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                streamRef.current = stream
                setIsCameraActive(true)
            }
        } catch (err) {
            setError('Camera access denied. Please enable camera permissions.')
        }
    }, [])

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
        }
        setIsCameraActive(false)
    }, [])

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

            // Upload to Supabase Storage
            let imageUrl = null
            if (user) {
                const fileName = `${user.id}/${Date.now()}.jpg`
                const { data: uploadData } = await supabase.storage
                    .from('product-scans')
                    .upload(fileName, dataURLtoBlob(capturedImage), {
                        contentType: 'image/jpeg',
                    })

                if (uploadData) {
                    const { data: urlData } = supabase.storage
                        .from('product-scans')
                        .getPublicUrl(fileName)
                    imageUrl = urlData?.publicUrl
                }
            }

            // Analyze with Gemini
            const result = await analyzeProductImage(base64)

            // Save scan to database
            const scanData = {
                imageUrl,
                productName: result.productName || 'Unknown Product',
                ingredients: result.ingredients || [],
                harmfulChemicals: result.harmfulChemicals || [],
                grade: result.overallGrade || 'C',
                score: result.toxicityScore || 50,
            }

            const savedScan = await saveScan(scanData)
            await incrementScan()

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
                    {!isCameraActive && !capturedImage && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-surface-muted"
                        >
                            <Camera size={48} className="text-text-muted mb-4" />
                            <p className="text-text-secondary text-sm mb-6">
                                Tap to open camera
                            </p>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={startCamera}
                                className="px-8 py-3 bg-primary text-white rounded-[var(--radius-button)] font-semibold text-sm"
                            >
                                Open Camera
                            </motion.button>
                        </motion.div>
                    )}

                    {isCameraActive && (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                            {/* Scan Frame Overlay */}
                            <div className="absolute inset-0 pointer-events-none">
                                {/* Corner brackets */}
                                <div className="absolute top-6 left-6 w-12 h-12 border-t-3 border-l-3 border-white/80 rounded-tl-lg" />
                                <div className="absolute top-6 right-6 w-12 h-12 border-t-3 border-r-3 border-white/80 rounded-tr-lg" />
                                <div className="absolute bottom-6 left-6 w-12 h-12 border-b-3 border-l-3 border-white/80 rounded-bl-lg" />
                                <div className="absolute bottom-6 right-6 w-12 h-12 border-b-3 border-r-3 border-white/80 rounded-br-lg" />
                            </div>
                        </>
                    )}

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
                                {mode === 'Label' && '🏷️ '}
                                {mode === 'Barcode' && '📊 '}
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

            {/* Error */}
            {error && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-danger text-sm px-5 mb-3"
                >
                    {error}
                </motion.p>
            )}

            {/* Action Buttons */}
            <div className="px-5 pb-8">
                {isCameraActive && (
                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={captureImage}
                        className="w-full py-4 bg-primary text-white rounded-[var(--radius-button)] font-semibold text-[15px] flex items-center justify-center gap-2"
                    >
                        <Camera size={18} />
                        Capture
                    </motion.button>
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
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </motion.div>
    )
}
