import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { metadata } = await request.json()

    // Pinata JSON Upload Endpoint
    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY || '',
        pinata_secret_api_key:
          process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY || '',
      },
      body: JSON.stringify(metadata),
    })

    if (!res.ok) {
      throw new Error('Failed to upload to Pinata')
    }

    const data = await res.json()
    return NextResponse.json({ ipfsHash: data.IpfsHash })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
