import { getAssociatedTokenAddress } from '@solana/spl-token'
import { ASSOCIATED_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token'
import {
  Connection,
  clusterApiUrl,
  SystemProgram,
  PublicKey,
} from '@solana/web3.js'
import * as anchor from '@project-serum/anchor'

const PRESALE_SEED = 'PRESALE_SEED'
const USER_SEED = 'USER_SEED'
const PRESALE_VAULT = 'PRESALE_VAULT'
const PROGRAM_ID = anchor.utils.token.TOKEN_PROGRAM_ID

const connection = new Connection(clusterApiUrl('devnet'))
const adminPubkey = new anchor.web3.PublicKey(
  'CGQB1L184FwDeJeub8Fwso694J9dXqumCYFY2CeF4J5G'
)
const programId = new anchor.web3.PublicKey(
  'Ewq6vDD2BXbepcuBCxNyrc8g5q2kyeh19o7aAcVzwnfg'
)
const provider = new anchor.AnchorProvider(connection, window.solana, {
  commitment: 'confirmed',
})

const mint = new PublicKey('3n5bTsfVfbaSF4q9x4VJZRbcnoTQSYNKXFB5pgZ4Q2rg')

const loadIDL = async () => {
  try {
    const response = await fetch('/presale.json') // Fetch IDL from /static folder
    const idl = await response.json()
    return idl
  } catch (error) {
    console.error('Failed to load IDL:', error)
  }
}

// address of userinfo PDA
const getUserInfoPDA = async () => {
  return (
    await PublicKey.findProgramAddressSync([Buffer.from(USER_SEED)], PROGRAM_ID)
  )[0]
}

// address of presaleinfo PDA
const getPresalePDA = async () => {
  return await PublicKey.findProgramAddressSync(
    [Buffer.from(PRESALE_SEED)],
    PROGRAM_ID
  )
}

// address of presalevault PDA
const getVaultPDA = async () => {
  return await PublicKey.findProgramAddressSync(
    [Buffer.from(PRESALE_VAULT)],
    PROGRAM_ID
  )
}

/**
 * Get the associated token address for a given mint and owner
 * @param {PublicKey} mint - The mint address of the token
 * @param {PublicKey} owner - The owner of the associated token account
 * @param {boolean} allowOwnerOffCurve - If true, allows the owner to be a PDA (default: false)
 * @returns {Promise<PublicKey>} - The associated token address
 */
const getAssociatedTokenAddressSync = async (
  mint,
  owner,
  allowOwnerOffCurve = false
) => {
  return await getAssociatedTokenAddress(
    mint, // The token mint address
    owner, // The wallet or PDA that owns the token
    allowOwnerOffCurve // Whether the owner can be off-curve (defaults to false)
  )
}

export const connectWallet = async () => {
  if (!window.solana) throw new Error('Solana wallet not found')

  const response = await window.solana.connect()
  const publicKey = response.publicKey.toString()
  console.log('Connected to wallet:', publicKey)

  return response.publicKey
}

export const buyToken = async (buyerPubkey, quoteSolAmount) => {
  const idl = await loadIDL()
  console.log('idl', idl)
  console.log('programId', programId)
  console.log('provider', provider)

  const program = new anchor.Program(idl, programId, provider)

  const [presalePDA] = await getPresalePDA()
  const [presaleVault] = await getVaultPDA()
  const userInfo = await getUserInfoPDA()

  console.log('program', program)
  const tx = await program.methods
    .buyToken(quoteSolAmount)
    .accountsPartial({
      userInfo,
      presaleInfo: presalePDA,
      presaleAuthority: adminPubkey,
      presaleVault: presaleVault,
      buyer: buyerPubkey, // dia chi vi user
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: SystemProgram.programId,
      tokenProgram: PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
    })
    .signers([buyerPubkey])
    .transaction()

  tx.feePayer = buyerPubkey
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

  const signature = await anchor.web3.sendAndConfirmTransaction(
    connection,
    tx,
    [buyerPubkey]
  )
  console.log(
    `Transaction success: https://solscan.io/tx/${signature}?cluster=devnet`
  )

  return signature
}

export const claimToken = async (buyerPubkey) => {
  const [presalePDA, bump] = await getPresalePDA()

  const presalePresaleTokenATA = await getAssociatedTokenAddressSync(
    mint,
    presalePDA,
    true
  )
  const buyerPresaleTokenATA = await getAssociatedTokenAddressSync(
    mint,
    buyerPubkey,
    true
  )
  const userInfo = await getUserInfoPDA()
  const [presaleInfo] = await getPresalePDA()

  const tx = await program.methods
    .claimToken(bump)
    .accountsPartial({
      presaleTokenMintAccount: mint,
      buyerPresaleTokenAssociatedTokenAccount: buyerPresaleTokenATA,
      presalePresaleTokenAssociatedTokenAccount: presalePresaleTokenATA,
      userInfo: userInfo,
      presaleInfo: presaleInfo,
      presaleAuthority: adminPubkey,
      buyer: buyerPubkey,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([buyerPubkey])
    .transaction()

  const signature = await anchor.web3.sendAndConfirmTransaction(
    connection,
    tx,
    [buyerPubkey]
  )
  console.log(
    `Transaction success: https://solscan.io/tx/${signature}?cluster=devnet`
  )

  return signature
}
