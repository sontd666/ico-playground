import { getAssociatedTokenAddress } from '@solana/spl-token'
import {
  ASSOCIATED_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@coral-xyz/anchor/dist/cjs/utils/token'
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor'
import {
  Connection,
  clusterApiUrl,
  SystemProgram,
  PublicKey,
  sendAndConfirmTransaction,
  SYSVAR_RENT_PUBKEY,
  LAMPORTS_PER_SOL,
  SendTransactionError,
} from '@solana/web3.js'

const USER_SEED = 'USER_SEED'
const PRESALE_SEED = 'PRESALE_SEED'
const PRESALE_VAULT = 'PRESALE_VAULT'

const mint = new PublicKey('3n5bTsfVfbaSF4q9x4VJZRbcnoTQSYNKXFB5pgZ4Q2rg')
const PROGRAM_ID = new PublicKey('Ewq6vDD2BXbepcuBCxNyrc8g5q2kyeh19o7aAcVzwnfg')
const adminPubkey = new PublicKey(
  'CGQB1L184FwDeJeub8Fwso694J9dXqumCYFY2CeF4J5G'
)

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
const provider = new AnchorProvider(connection, window.solana, {
  commitment: 'processed',
})

const loadIDL = async () => {
  try {
    const response = await fetch('/presale.json')
    const idl = await response.json()
    return idl
  } catch (error) {
    console.error('Failed to load IDL:', error)
  }
}

// address of userinfo PDA
const getUserInfoPDA = () => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(USER_SEED)],
    PROGRAM_ID
  )[0]
}
// address of presaleinfo PDA
const getPresalePDA = () => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PRESALE_SEED)],
    PROGRAM_ID
  )
}
// address of presalevault PDA
const getVaultPDA = () => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PRESALE_VAULT)],
    PROGRAM_ID
  )
}

export const connectWallet = async () => {
  if (!window.solana || !window.solana.isPhantom)
    throw new Error('Please install Phantom Wallet')

  const response = await window.solana.connect()
  const publicKey = response.publicKey.toString()
  console.log('Connected to wallet:', publicKey)

  return response.publicKey
}

export const buyToken = async (buyerPubkey, quoteSolAmount) => {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
  const provider = new AnchorProvider(connection, window.solana, {
    commitment: 'processed',
  })
  const idl = await loadIDL()
  const program = new Program(idl, provider)

  const [presalePDA] = getPresalePDA()
  const [presaleVault] = getVaultPDA()
  const userInfo = getUserInfoPDA()

  try {
    // preparing transaction
    const tx = await program.methods
      .buyToken(new BN(quoteSolAmount * LAMPORTS_PER_SOL))
      .accountsPartial({
        userInfo,
        presaleVault,
        presaleInfo: presalePDA,
        presaleAuthority: adminPubkey,
        buyer: buyerPubkey,
        rent: SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      })
      .transaction()
    tx.feePayer = buyerPubkey
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

    // Simulate transaction (optional for debugging)
    console.log('Simulating transaction...')
    console.log(await connection.simulateTransaction(tx))

    // Sign and send transaction
    const signedTx = await window.solana.signTransaction(tx)
    const signature = await connection.sendRawTransaction(signedTx.serialize())
    await connection.confirmTransaction(signature)

    console.log(
      `Transaction successful: https://solscan.io/tx/${signature}?cluster=devnet`
    )

    // Fetch post-transaction state
    const userState = await program.account.userInfo.fetch(userInfo)
    const vaultBalance = await connection.getBalance(presaleVault)

    console.log(
      'Presale Vault Balance:',
      vaultBalance,
      'Address:',
      presaleVault
    )
    console.log('User State:', userState)

    return signature
  } catch (error) {
    throw error
  }
}

export const claimToken = async (buyerPubkey) => {
  const [presalePDA, bump] = getPresalePDA()
  const userInfo = getUserInfoPDA()
  const [presaleInfo] = getPresalePDA()

  const presalePresaleTokenAssociatedTokenAccount =
    await getAssociatedTokenAddress(mint, presalePDA, true)
  console.log('presale ATA: ', presalePresaleTokenAssociatedTokenAccount)
  console.log(
    'token balance: ',
    await connection.getTokenAccountBalance(
      presalePresaleTokenAssociatedTokenAccount
    )
  )
  const buyerPresaleTokenAssociatedTokenAccount =
    await getAssociatedTokenAddress(mint, buyerPubkey, true)
  console.log('buyer ATA: ', presalePresaleTokenAssociatedTokenAccount)
  console.log(
    'token balance: ',
    await connection.getTokenAccountBalance(
      presalePresaleTokenAssociatedTokenAccount
    )
  )

  const tx = await program.methods
    .claimToken(bump)
    .accountsPartial({
      presaleTokenMintAccount: mint,
      buyerPresaleTokenAssociatedTokenAccount:
        buyerPresaleTokenAssociatedTokenAccount,
      presalePresaleTokenAssociatedTokenAccount:
        presalePresaleTokenAssociatedTokenAccount,
      userInfo,
      presaleInfo,
      presaleAuthority: adminPubkey,
      buyer: buyerPubkey,
      rent: SYSVAR_RENT_PUBKEY,
      systemProgram: web3.SystemProgram.programId,
    })
    .signers([buyer])
    .transaction()

  const signature = await sendAndConfirmTransaction(connection, tx, [
    buyerPubkey,
  ])
  console.log(
    `Transaction success: https://solscan.io/tx/${signature}?cluster=devnet`
  )

  return signature
}
