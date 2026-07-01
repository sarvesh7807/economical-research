/**
 * VectorStoreAdapter — semantic similarity search.
 * Current impl: NO-OP (term-overlap used instead in ResearchMemory).
 * Future swap: Pinecone / pgvector — replace upsert/search methods.
 * ResearchMemory.findSimilar() calls this adapter — zero changes there when upgrading.
 */
class VectorStoreAdapter {
  /** @param {string} _id @param {number[]} _vector @param {object} _metadata */
  async upsert(_id, _vector, _metadata) {
    // no-op — vector storage not yet provisioned
  }

  /**
   * @param {number[]} _vector
   * @param {number} _topK
   * @returns {Promise<Array<{id: string, score: number, metadata: object}>>}
   */
  async search(_vector, _topK = 5) {
    // no-op — returns empty; ResearchMemory falls back to term-overlap
    return [];
  }

  async deleteByFilter(_filter) {
    // no-op
  }

  /** @returns {boolean} */
  isAvailable() { return false; } // flip to true when Pinecone provisioned
}

export default new VectorStoreAdapter();
