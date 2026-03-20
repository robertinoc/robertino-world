import { Space_Grotesk } from 'next/font/google'
import './globals.css'

const font = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

export const metadata = {
  title: 'robertino.world',
  description: 'An interactive cosmic universe — explore the universe of Robertino.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={font.className}>{children}</body>
    </html>
  )
}
