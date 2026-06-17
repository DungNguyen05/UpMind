import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cptutor.dev' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@cptutor.dev',
      passwordHash: await bcrypt.hash('admin123', 12),
      role: 'admin',
    },
  })
  const student = await prisma.user.upsert({
    where: { email: 'student01@cptutor.dev' },
    update: {},
    create: {
      username: 'student01',
      email: 'student01@cptutor.dev',
      passwordHash: await bcrypt.hash('student123', 12),
      role: 'student',
    },
  })

  const topicData = [
    { name: 'Array',               slug: 'array' },
    { name: 'Hash Map',            slug: 'hash-map' },
    { name: 'Brute Force',         slug: 'brute-force' },
    { name: 'Sorting',             slug: 'sorting' },
    { name: 'Binary Search',       slug: 'binary-search' },
    { name: 'Two Pointers',        slug: 'two-pointers' },
    { name: 'Prefix Sum',          slug: 'prefix-sum' },
    { name: 'Stack & Queue',       slug: 'stack-queue' },
    { name: 'Backtracking',        slug: 'backtracking' },
    { name: 'Greedy',              slug: 'greedy' },
    { name: 'Dynamic Programming', slug: 'dp' },
    { name: 'Graph',               slug: 'graph' },
    { name: 'Math',                slug: 'math' },
    { name: 'String',              slug: 'string' },
  ]

  const topics: Record<string, { id: string }> = {}
  for (const t of topicData) {
    const topic = await prisma.topic.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    })
    topics[t.slug] = topic
  }

  const twoSum = await prisma.problem.upsert({
    where: { slug: 'two-sum' },
    update: {},
    create: {
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: 'easy',
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      isPublished: true,
      createdById: admin.id,
      description: `## Mô tả
Cho mảng số nguyên \`a\` gồm \`n\` phần tử và số nguyên \`target\`.
Tìm **hai chỉ số** \`i\`, \`j\` (i < j) sao cho \`a[i] + a[j] = target\`.
Đảm bảo luôn tồn tại đúng một cặp đáp án.

## Input
- Dòng 1: hai số nguyên \`n\` và \`target\` (2 ≤ n ≤ 200000, -10⁹ ≤ target ≤ 10⁹)
- Dòng 2: \`n\` số nguyên \`a[i]\` (-10⁹ ≤ a[i] ≤ 10⁹)

## Output
Hai chỉ số \`i j\` (0-indexed), cách nhau dấu cách.

## Ràng buộc
\`\`\`
2 ≤ n ≤ 200000
-10⁹ ≤ a[i], target ≤ 10⁹
\`\`\``,
    },
  })
  await prisma.problemTopic.createMany({
    data: [
      { problemId: twoSum.id, topicId: topics['array'].id },
      { problemId: twoSum.id, topicId: topics['hash-map'].id },
    ],
    skipDuplicates: true,
  })

  const n = 200000
  const a = Array.from({ length: n }, (_, i) => i + 1)
  const twoSumTests = [
    { input: '4 9\n2 7 11 15', expectedOutput: '0 1', isSample: true, orderIndex: 0 },
    { input: '3 6\n3 2 4', expectedOutput: '1 2', isSample: false, orderIndex: 1 },
    {
      input: `${n} ${n + (n - 1)}\n${a.join(' ')}`,
      expectedOutput: `${n - 2} ${n - 1}`,
      isSample: false,
      orderIndex: 2,
    },
  ]
  await prisma.testCase.deleteMany({ where: { problemId: twoSum.id } })
  await prisma.testCase.createMany({
    data: twoSumTests.map((t) => ({ ...t, problemId: twoSum.id })),
  })

  const lis = await prisma.problem.upsert({
    where: { slug: 'lis' },
    update: {},
    create: {
      title: 'Longest Increasing Subsequence',
      slug: 'lis',
      difficulty: 'medium',
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      isPublished: true,
      createdById: admin.id,
      description: `## Mô tả
Cho dãy số nguyên \`a\` gồm \`n\` phần tử. Tìm độ dài dãy con tăng dài nhất (LIS).

## Input
- Dòng 1: n (1 ≤ n ≤ 100000)
- Dòng 2: n số nguyên

## Output
Một số nguyên — độ dài LIS.

## Ràng buộc
\`\`\`
1 ≤ n ≤ 100000
-10⁹ ≤ a[i] ≤ 10⁹
\`\`\``,
    },
  })
  await prisma.problemTopic.createMany({
    data: [
      { problemId: lis.id, topicId: topics['dp'].id },
      { problemId: lis.id, topicId: topics['binary-search'].id },
    ],
    skipDuplicates: true,
  })
  await prisma.testCase.deleteMany({ where: { problemId: lis.id } })
  await prisma.testCase.createMany({
    data: [
      { problemId: lis.id, input: '6\n3 1 2 1 8 5', expectedOutput: '3', isSample: true, orderIndex: 0 },
      { problemId: lis.id, input: '1\n5', expectedOutput: '1', isSample: false, orderIndex: 1 },
      { problemId: lis.id, input: '5\n5 4 3 2 1', expectedOutput: '1', isSample: false, orderIndex: 2 },
    ],
  })

  const sp = await prisma.problem.upsert({
    where: { slug: 'shortest-path-queries' },
    update: {},
    create: {
      title: 'Shortest Path Queries',
      slug: 'shortest-path-queries',
      difficulty: 'hard',
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      isPublished: true,
      createdById: admin.id,
      description: `## Mô tả
Cho đồ thị có hướng \`n\` đỉnh, \`m\` cạnh có trọng số. Trả lời \`q\` truy vấn, mỗi truy vấn hỏi đường đi ngắn nhất từ \`s\` đến \`t\`.

## Input
- Dòng 1: n m (1 ≤ n,m ≤ 100000)
- m dòng tiếp: u v w (cạnh từ u tới v, trọng số w ≥ 0)
- Dòng tiếp: q
- q dòng tiếp: s t

## Output
q dòng, mỗi dòng in đường đi ngắn nhất hoặc -1 nếu không tồn tại.`,
    },
  })
  await prisma.problemTopic.createMany({
    data: [{ problemId: sp.id, topicId: topics['graph'].id }],
    skipDuplicates: true,
  })
  await prisma.testCase.deleteMany({ where: { problemId: sp.id } })
  await prisma.testCase.createMany({
    data: [
      {
        problemId: sp.id,
        input: '4 4\n1 2 1\n2 3 2\n3 4 3\n1 4 10\n1\n1 4',
        expectedOutput: '6',
        isSample: true,
        orderIndex: 0,
      },
      { problemId: sp.id, input: '2 1\n1 2 5\n1\n2 1', expectedOutput: '-1', isSample: false, orderIndex: 1 },
      {
        problemId: sp.id,
        input: '3 3\n1 2 4\n1 3 10\n2 3 1\n2\n1 3\n3 1',
        expectedOutput: '5\n-1',
        isSample: false,
        orderIndex: 2,
      },
    ],
  })

  console.log('Seed complete:', {
    admin: admin.username,
    student: student.username,
    problems: 3,
    topics: topicData.length,
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
