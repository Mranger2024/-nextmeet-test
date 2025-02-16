import * as forge from 'node-forge'
import fs from 'fs'
import path from 'path'

async function generateCertificates() {
  const certDir = path.join(process.cwd(), 'certificates')

  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir)
  }

  // Generate CA key pair
  const caKeys = forge.pki.rsa.generateKeyPair(4096)
  const caCert = forge.pki.createCertificate()

  caCert.publicKey = caKeys.publicKey
  caCert.serialNumber = '01'
  caCert.validity.notBefore = new Date()
  caCert.validity.notAfter = new Date()
  caCert.validity.notAfter.setFullYear(caCert.validity.notBefore.getFullYear() + 1)

  const caAttrs = [{
    name: 'commonName',
    value: 'NextMeet Dev CA'
  }]

  caCert.setSubject(caAttrs)
  caCert.setIssuer(caAttrs)
  caCert.setExtensions([{
    name: 'basicConstraints',
    cA: true
  }])

  // Self-sign CA certificate
  caCert.sign(caKeys.privateKey, forge.md.sha256.create())

  // Generate server key pair
  const serverKeys = forge.pki.rsa.generateKeyPair(2048)
  const serverCert = forge.pki.createCertificate()

  serverCert.publicKey = serverKeys.publicKey
  serverCert.serialNumber = '02'
  serverCert.validity.notBefore = new Date()
  serverCert.validity.notAfter = new Date()
  serverCert.validity.notAfter.setFullYear(serverCert.validity.notBefore.getFullYear() + 1)

  const serverAttrs = [{
    name: 'commonName',
    value: 'localhost'
  }]

  serverCert.setSubject(serverAttrs)
  serverCert.setIssuer(caAttrs)
  serverCert.setExtensions([{
    name: 'subjectAltName',
    altNames: [
      { type: 2, value: 'localhost' },
      { type: 2, value: 'your.local.ip' },
      { type: 7, ip: '127.0.0.1' },
      { type: 7, ip: 'your.local.ip' }
    ]
  }])

  // Sign server certificate with CA
  serverCert.sign(caKeys.privateKey, forge.md.sha256.create())

  // Convert to PEM format
  const caCertPem = forge.pki.certificateToPem(caCert)
  const caKeyPem = forge.pki.privateKeyToPem(caKeys.privateKey)
  const serverCertPem = forge.pki.certificateToPem(serverCert)
  const serverKeyPem = forge.pki.privateKeyToPem(serverKeys.privateKey)

  // Save certificates and keys
  fs.writeFileSync(path.join(certDir, 'ca-cert.pem'), caCertPem)
  fs.writeFileSync(path.join(certDir, 'ca-key.pem'), caKeyPem)
  fs.writeFileSync(path.join(certDir, 'cert.pem'), serverCertPem)
  fs.writeFileSync(path.join(certDir, 'key.pem'), serverKeyPem)

  console.log('Certificates generated successfully!')
}

generateCertificates().catch(console.error) 