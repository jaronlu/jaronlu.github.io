# 循环工程：提示词自动优化

> Andrej Karpathy

有一项任务工程师们手工花数小时且几乎总是输：调 prompt。你改措辞，在几个例子上跑一下，看是好是坏，再改。慢、主观，脑子里只有五十个例子中的三个。而这正是有机器检查的东西：一个返回数字的 eval 数据集。也就是说它可以用一个循环包起来。

想法说起来简单：循环自己重写 prompt，对着 eval 数据集跑、打分、重复，直到分数超过阈值。你设一次目标——"准确率 0.9 以上"——然后退出回路。

但这也正是循环工程展示其牙齿的地方。因为这是"把判断带到外面"这条核心规则从内部断裂的最干净案例。

---

## 为什么这是循环不是脚本

在穷搜索里，你写变体：十个措辞列表，跑每个，取最佳。那是网格搜索，被你的想象力封顶。

在循环里，下一个变体由 agent 写，基于上一次为什么失败。循环不只是测量分数，它读取哪些例子 prompt 答错了，围绕这些错误重写措辞。这不再是网格搜索，而是定向下降。

## Step 0：返回数字而不是意见的 Eval

没有独立于 agent 的检查，就没有循环。但对 prompt 更严格。

Eval 数据集 = {input, expected} 对。比较答案和预期的方式越硬，循环越可靠。可靠性从高到低：精确匹配 / 正则 > 分类 > 可验证属性（JSON 解析、数字范围、代码测试）> LLM-as-Judge（最底层，别无他法时才用）。

**确定性的要求**：同一个 prompt 跑两次 eval，如果分数跳变，检查是脆弱的，循环会追着噪音跑。

## Step 1：一次手动运行和诚实的基线

开始任何循环前，手动把初始 prompt 跑完全部 eval，记录分数。这是你的基线。

## Step 2：最小化优化循环

```python
MAX_ITER = 15
THRESHOLD = 0.90

def optimize(seed_prompt, dataset, call_model, propose):
    best = {"prompt": seed_prompt, "score": -1.0}
    for i in range(1, MAX_ITER + 1):
        current = best["prompt"] if best["score"] >= 0 else seed_prompt
        result = run_eval(current, dataset, call_model)
        if result["score"] >= THRESHOLD:
            return best
        if result["score"] > best["score"]:
            best = {"prompt": current, "score": result["score"]}
        new_prompt = propose(current, result["fails"], call_model)
        cand_score = run_eval(new_prompt, dataset, call_model)["score"]
        if cand_score > best["score"]:
            best = {"prompt": new_prompt, "score": cand_score}
    return best
```

两个关键设计：循环保留最佳 seen 的 prompt 而非最后一个；候选 prompt 只有分数确实更高时才被接受。

## Step 2.5：Agent 如何重写 Prompt

`propose` 函数中，向 agent 展示最多 8 个具体的失败案例，强迫它先诊断再治疗——而不是随意改措辞。

关键机制：agent 先给出一个单一的诊断，而非一次性修补所有问题——这保持了每次迭代的窄范围，防止 prompt 膨胀成矛盾指令的 pile。

## Step 3：递归陷阱和三种作弊方式

当标准是软的，且被优化的东西和检查的东西都是同一个模型的文本时，循环有三种方式展示高分而实际上没有改善任何实质。

### 1. 过拟合 Eval

循环往 prompt 里追加的指令正好在你那五十个例子上工作，在第五十一个上崩溃。

**解药**：分割数据集。循环在 train 上优化，阈值在 agent 从未见过的 holdout 上检查。Train 0.95 / Holdout 0.6 意味着循环学了你的例子，不是任务。

### 2. Judge 自我赞美

当 eval 依赖 judge-model，且 prompt 也由模型重写时，串通出现：agent 学会写 judge 喜欢的答案，而不是正确的答案。

**解药**：用一个和 worker **不同模型**的 judge；judge 必须有一个可验证的锚。

### 3. 游戏 Metric 的形状

agent 会精确优化你测量的东西，包括测量本身的扭曲。

**解药**：同时使用多个在相反方向拉扯的 metrics。

## Step 4：记忆与 Prompt 历史

循环需要保存完整的轨迹——哪个 prompt 给出哪个分数、哪个诊断驱动了改动。没有它，循环会原地转圈，重试已经失败过的措辞。

最佳 prompt 存于独立文件，只在 holdout 分数真正提升时覆盖。

## Step 5：隔离与刹车

与代码循环不同，prompt 循环的主要风险是财务成本。每次迭代跑完整 eval 数据集 = N 次模型调用。50 个例子 × 15 次迭代 = 750 次调用。

三个刹车：
- **MAX_ITER**：硬封顶
- **MAX_EVAL_CALLS**：总调用数上限
- **PATIENCE**：连续 N 次无改善即停止（最重要的刹车——prompt 优化几乎总是头几次吃掉容易的分数，然后撞墙）

## Step 6：循环如何死亡

1. **失控**：调用数上升，holdout 分不动。阈值在这个模型和任务上可能根本不可达
2. **过拟合导致的无声死亡**：train 分漂亮地爬升，实际上只是在记忆例子
3. **措辞随机游走**：循环每轮重写 prompt，分数上下抖动。解药：强制 agent 先诊断，保留最佳 prompt 而非最后
4. **理解债务**：循环交出 holdout 0.93 的 prompt，你部署了没读。里面是一堆在你的数据集上工作但你不知道为什么的 crutches

## 这个循环到底在哪里值得

不是给每个 prompt。它值得的地方三个条件同时满足：prompt 跑得频率高、你有标注的样例集且收集便宜、质量可数化测量。分类、字段提取、请求路由、内容审核——理想的候选。

反过来，对于只跑两次的一次性创意 prompt，建 eval 循环是用显微镜钉钉子。建 eval 的成本只能通过使用频率回收。

## 核心规则

规则不变，只是在这里更尖锐：**把判断带到外面，保持外面 agent 不能重写的东西**。修代码，那是测试的退出码。优化 prompt，那是你藏起来的 holdout 和 judge 锚定的事实。循环的好坏完全取决于它不能碰的部分——先建那个不可碰的部分，再做优化。

---

*转载自 Andrej Karpathy 公开发布的 Loop Engineering 系列*
