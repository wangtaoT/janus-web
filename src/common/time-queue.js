class TimeQueue {
    constructor(length = 100) {
        this.length = length;
        this.items = [];
    }

    push(item) {
        if (this.items.length > this.length) {
            this.items.shift();
        }
        this.items.push([new Date().getTime(), item]);
    }

    count(timeGreaterThan) {
        let count = 0;
        for (let i = this.items.length - 1; i >= 0; i --) {
            let item = this.items[i];

            if (item[0] > timeGreaterThan) {
                count ++;
            } else {
                break;
            }
        }

        return count;
    }

    sum(timeGreaterThan) {
        let sum = 0;
        for (let i = this.items.length - 1; i >= 0; i --) {
            let item = this.items[i];

            if (item[0] > timeGreaterThan) {
                sum += item[1];
            } else {
                break;
            }
        }

        return sum;
    }

    clear() {
        this.items = [];
    }
}

export default TimeQueue;
