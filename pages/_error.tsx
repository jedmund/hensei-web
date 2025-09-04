import { NextPageContext } from 'next'
import Head from 'next/head'
import Link from 'next/link'

interface ErrorProps {
  statusCode: number
}

function Error({ statusCode }: ErrorProps) {
  return (
    <div className="error-page" style={{ padding: '2rem', textAlign: 'center' }}>
      <Head>
        <title>
          {statusCode
            ? `${statusCode} - Server Error / granblue.team`
            : 'Client Error / granblue.team'}
        </title>
      </Head>
      
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>{statusCode || 'Error'}</h1>
        <p style={{ marginBottom: '2rem' }}>
          {statusCode
            ? `A ${statusCode} error occurred on the server.`
            : 'An error occurred on the client.'}
        </p>
        <Link href="/" style={{ 
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#007bff',
          color: 'white',
          borderRadius: '0.25rem',
          textDecoration: 'none'
        }}>
          Go Home
        </Link>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error