import { Router } from 'express';
import { geneRateAi, updatePreferences, fetchRecommendations } from '../services/geminiService'
// import { protect } from '../middleware/auth';

const router = Router();


router.post('/chat', async (req, res) => {
    const { message, userMessageId } = req.body
    console.log(message, userMessageId)

    if (!message || !userMessageId) {
        throw Error('message and userMessageId is required')
    }

    const result = await geneRateAi(message, userMessageId)
    console.log("result", result)
    res.json({
        message: result
    })


})
router.put('/preferences', updatePreferences);
router.get('/recommendations', fetchRecommendations);

export default router;
