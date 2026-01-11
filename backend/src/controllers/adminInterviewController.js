import InterviewQuestion from '../models/InterviewQuestion.js';

// Get all questions for a domain
export const getQuestionsByDomain = async (req, res) => {
  try {
    const { domain } = req.params;

    const questions = await InterviewQuestion.find({ domain })
      .sort({ order: 1 })
      .populate('createdBy', 'name email');

    res.json({ questions });

  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to get questions' });
  }
};

// Get all questions (all domains)
export const getAllQuestions = async (req, res) => {
  try {
    const questions = await InterviewQuestion.find()
      .sort({ domain: 1, order: 1 })
      .populate('createdBy', 'name email');

    res.json({ questions });

  } catch (error) {
    console.error('Get all questions error:', error);
    res.status(500).json({ error: 'Failed to get questions' });
  }
};

// Create new question
export const createQuestion = async (req, res) => {
  try {
    const { domain, question, order } = req.body;

    if (!domain || !question) {
      return res.status(400).json({ error: 'Domain and question are required' });
    }

    const newQuestion = new InterviewQuestion({
      domain,
      question,
      order: order || 0,
      createdBy: req.user._id
    });

    await newQuestion.save();

    res.status(201).json({
      message: 'Question created successfully',
      question: newQuestion
    });

  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
};

// Update question
export const updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { question, order, isActive } = req.body;

    const updatedQuestion = await InterviewQuestion.findByIdAndUpdate(
      questionId,
      { question, order, isActive },
      { new: true, runValidators: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({
      message: 'Question updated successfully',
      question: updatedQuestion
    });

  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
};

// Delete question
export const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await InterviewQuestion.findByIdAndDelete(questionId);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ message: 'Question deleted successfully' });

  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
};

// Bulk create questions
export const bulkCreateQuestions = async (req, res) => {
  try {
    const { domain, questions } = req.body;

    if (!domain || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Domain and questions array are required' });
    }

    const questionDocs = questions.map((q, index) => ({
      domain,
      question: q,
      order: index + 1,
      createdBy: req.user._id
    }));

    const created = await InterviewQuestion.insertMany(questionDocs);

    res.status(201).json({
      message: `${created.length} questions created successfully`,
      questions: created
    });

  } catch (error) {
    console.error('Bulk create error:', error);
    res.status(500).json({ error: 'Failed to create questions' });
  }
};

// Reorder questions
export const reorderQuestions = async (req, res) => {
  try {
    const { domain, questionIds } = req.body;

    if (!domain || !Array.isArray(questionIds)) {
      return res.status(400).json({ error: 'Domain and questionIds array are required' });
    }

    // Update order for each question
    const updates = questionIds.map((id, index) =>
      InterviewQuestion.findByIdAndUpdate(id, { order: index + 1 })
    );

    await Promise.all(updates);

    res.json({ message: 'Questions reordered successfully' });

  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ error: 'Failed to reorder questions' });
  }
};

export default {
  getQuestionsByDomain,
  getAllQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkCreateQuestions,
  reorderQuestions
};
