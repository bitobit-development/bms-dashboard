import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'

const INPUT_LOGO = path.join(process.cwd(), 'public/images/logos/bit2bit-logo.jpg')
const OUTPUT_DIR = path.join(process.cwd(), 'public')

interface IconSize {
  name: string
  size: number
  outputPath: string
}

const ICON_SIZES: IconSize[] = [
  { name: 'favicon-16x16.png', size: 16, outputPath: 'public/favicon-16x16.png' },
  { name: 'favicon-32x32.png', size: 32, outputPath: 'public/favicon-32x32.png' },
  { name: 'apple-touch-icon.png', size: 180, outputPath: 'public/apple-touch-icon.png' },
  { name: 'icon-192.png', size: 192, outputPath: 'public/icon-192.png' },
  { name: 'icon-512.png', size: 512, outputPath: 'public/icon-512.png' },
]

async function generateFavicons() {
  console.log('🎨 Generating favicons from bit2bit logo...\n')

  try {
    // Check if input file exists
    await fs.access(INPUT_LOGO)
    console.log('✓ Source logo found:', INPUT_LOGO)

    // Generate PNG icons
    for (const icon of ICON_SIZES) {
      const outputPath = path.join(process.cwd(), icon.outputPath)

      await sharp(INPUT_LOGO)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
        })
        .png()
        .toFile(outputPath)

      console.log(`✓ Generated ${icon.name} (${icon.size}x${icon.size})`)
    }

    // Generate favicon.ico (32x32 PNG format)
    const faviconIcoPath = path.join(OUTPUT_DIR, 'favicon.ico')
    await sharp(INPUT_LOGO)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(faviconIcoPath)

    console.log('✓ Generated favicon.ico (32x32)')

    // Generate Next.js app directory icons (optional but recommended)
    const appIconPath = path.join(process.cwd(), 'app/icon.png')
    await sharp(INPUT_LOGO)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(appIconPath)

    console.log('✓ Generated app/icon.png (512x512) for Next.js')

    const appleIconPath = path.join(process.cwd(), 'app/apple-icon.png')
    await sharp(INPUT_LOGO)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(appleIconPath)

    console.log('✓ Generated app/apple-icon.png (180x180) for Next.js')

    console.log('\n🎉 All favicons generated successfully!')
    console.log('\nGenerated files:')
    console.log('  - public/favicon.ico')
    console.log('  - public/favicon-16x16.png')
    console.log('  - public/favicon-32x32.png')
    console.log('  - public/apple-touch-icon.png')
    console.log('  - public/icon-192.png')
    console.log('  - public/icon-512.png')
    console.log('  - app/icon.png')
    console.log('  - app/apple-icon.png')
    console.log('\nNext steps:')
    console.log('1. ✓ Review the generated icons')
    console.log('2. Update app/layout.tsx metadata (if not using file-based icons)')
    console.log('3. Optionally create site.webmanifest for PWA support')

  } catch (error) {
    console.error('❌ Error generating favicons:', error)
    process.exit(1)
  }
}

generateFavicons()
