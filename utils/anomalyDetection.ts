export interface AnomalyResult {
    index: number;
    score: number;
    isAnomaly: boolean;
}

class IsolationTree {
    private splitColumn: string | null = null;
    private splitValue: number | null = null;
    private left: IsolationTree | null = null;
    private right: IsolationTree | null = null;
    private size: number = 0;
    private height: number = 0;

    constructor(data: any[], depth: number, maxHeight: number, columns: string[]) {
        this.size = data.length;
        if (depth >= maxHeight || data.length <= 1) {
            this.height = depth;
            return;
        }

        // Pick a random column
        this.splitColumn = columns[Math.floor(Math.random() * columns.length)];
        const values = data.map(d => d[this.splitColumn!]).filter(v => typeof v === 'number');

        if (values.length === 0) {
            this.height = depth;
            return;
        }

        const min = Math.min(...values);
        const max = Math.max(...values);

        if (min === max) {
            this.height = depth;
            return;
        }

        this.splitValue = min + Math.random() * (max - min);

        const leftData = data.filter(d => d[this.splitColumn!] < this.splitValue!);
        const rightData = data.filter(d => d[this.splitColumn!] >= this.splitValue!);

        this.left = new IsolationTree(leftData, depth + 1, maxHeight, columns);
        this.right = new IsolationTree(rightData, depth + 1, maxHeight, columns);
    }

    getPathLength(point: any, currentDepth: number): number {
        if (this.left === null || this.right === null) {
            return currentDepth + this.c(this.size);
        }

        if (point[this.splitColumn!] < this.splitValue!) {
            return this.left.getPathLength(point, currentDepth + 1);
        } else {
            return this.right.getPathLength(point, currentDepth + 1);
        }
    }

    private c(n: number): number {
        if (n <= 1) return 0;
        if (n === 2) return 1;
        return 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1) / n);
    }
}

export class IsolationForest {
    private trees: IsolationTree[] = [];
    private nTrees: number;
    private sampleSize: number;
    private columns: string[];

    constructor(nTrees: number = 100, sampleSize: number = 256) {
        this.nTrees = nTrees;
        this.sampleSize = sampleSize;
        this.columns = [];
    }

    fit(data: any[], columns: string[]) {
        this.columns = columns;
        const maxHeight = Math.ceil(Math.log2(this.sampleSize));

        for (let i = 0; i < this.nTrees; i++) {
            const sample = this.getRandomSample(data, this.sampleSize);
            this.trees.push(new IsolationTree(sample, 0, maxHeight, columns));
        }
    }

    predict(data: any[]): AnomalyResult[] {
        const scores = data.map((point, index) => {
            const pathLengths = this.trees.map(tree => tree.getPathLength(point, 0));
            const avgPathLength = pathLengths.reduce((a, b) => a + b, 0) / this.nTrees;

            // Anomaly score s(x, n) = 2 ^ -(E(h(x)) / c(n))
            const n = data.length;
            const cn = this.c(n);
            const score = Math.pow(2, -(avgPathLength / cn));

            return {
                index,
                score,
                isAnomaly: score > 0.6 // Common threshold for Isolation Forest
            };
        });

        return scores;
    }

    private getRandomSample(data: any[], size: number): any[] {
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, size);
    }

    private c(n: number): number {
        if (n <= 1) return 0;
        if (n === 2) return 1;
        return 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1) / n);
    }
}

export function detectAnomalies(data: any[], metric: string): AnomalyResult[] {
    const forest = new IsolationForest();
    forest.fit(data, [metric]);
    return forest.predict(data);
}
