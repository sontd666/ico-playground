<template>
  <div class="container">
    <button @click="connectWallet" class="btn">Kết nối ví</button>
    <button @click="buy" class="btn">Mua Token</button>
    <button @click="claim" class="btn">Claim Token</button>
  </div>
</template>

<script>
import { connectWallet, buyToken, claimToken } from '~/utils/solana'

export default {
  data() {
    return {
      wallet: null,
    }
  },
  methods: {
    async connectWallet() {
      try {
        this.wallet = await connectWallet()
        console.log('Wallet connected:', this.wallet.toString())
      } catch (error) {
        console.error(error)
      }
    },
    async buy() {
      if (!this.wallet) return alert('Kết nối ví trước!')
      const quoteSolAmount = 1 // Số SOL để mua
      try {
        await buyToken(this.wallet, quoteSolAmount)
        alert('Mua token thành công!')
      } catch (error) {
        console.error(error)
      }
    },
    async claim() {
      if (!this.wallet) return alert('Kết nối ví trước!')
      try {
        await claimToken(this.wallet)
        alert('Claim token thành công!')
      } catch (error) {
        console.error(error)
      }
    },
  },
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;

  > .btn {
    width: 300px;
    height: 48px;
    display: block;
    font-size: large;
  }
}
</style>
