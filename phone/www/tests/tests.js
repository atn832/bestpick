require.config({
    baseUrl: "../js/"
});

test("hello test", function() {
    ok(1 == "1");
});

require(["transformation"], function(Transformation) {
    var fullSize = {
        width: 100,
        height: 100
    };
    var fullSize2 = {
        width: 50,
        height: 400
    }
    var thumbnailSize = {
        width: 50,
        height: 200
    }
    var fitM = Transformation.getFitMatrix(fullSize, thumbnailSize);
    console.log(fitM);
    test("getFitMatrix", function() {
        ok(fitM.a === .5);
        ok(fitM.b === 0);
        ok(fitM.c === 0);
        ok(fitM.d === .5);
        ok(fitM.e === 0);
        ok(fitM.f === 75);
    });
    
    var fitM2 = Transformation.getFitMatrix(fullSize2, thumbnailSize);
    test("getFitMatrix2", function() {
        ok(fitM2.a === .5);
        ok(fitM2.b === 0);
        ok(fitM2.c === 0);
        ok(fitM2.d === .5);
        ok(fitM2.e === 12.5);
        ok(fitM2.f === 0);
    });
    
    var deviceImageSize = Transformation.transform(fullSize, fitM);
    test("deviceImageSize", function() {
        ok(deviceImageSize.width === 50);
        ok(deviceImageSize.height === 50);
    });
    var modelImageSize = Transformation.transform(deviceImageSize, fitM.inverse());
    test("deviceImageSize", function() {
        ok(modelImageSize.width === 100);
        ok(modelImageSize.height === 100);
    });
});

require(["rectangle"], function(Rectangle) {
    var r1 = Rectangle.createRectangle(5, 5, 10, 20);
    var r2 = Rectangle.createRectangle(0, 6, 7, 2);
    var i1 = Rectangle.getIntersection(r1, r2);
    test("intersection1", function() {
        ok(i1.x === 5);
        ok(i1.y === 6);
        ok(i1.width === 2);
        ok(i1.height === 2);
    });
});

require(["job", "variablepriorityqueue", "pool"], function(Job, VPQ, Pool) {
    var timeout = 500;
    
    var queues = [new VPQ(), new VPQ(), new VPQ(), new VPQ(), new VPQ()];
    
    // receives the result of a pool that runs a queue
    var result = [];
    
    var jobs = [
        new Job({
            priority: Job.Priority.Low,
            f: function(resolve, reject) {
                setTimeout(function() {
                    result.push(0);
                    resolve();
                }, timeout);
            }
        }), new Job({
            priority: Job.Priority.High,
            f: function(resolve, reject) {
                setTimeout(function() {
                    result.push(1);
                    resolve();
                }, timeout);
            }
        }), new Job({
            priority: Job.Priority.Low,
            f: function(resolve, reject) {
                setTimeout(function() {
                    result.push(2);
                    resolve();
                }, timeout);
            }
        }), new Job({
            priority: Job.Priority.High,
            f: function(resolve, reject) {
                setTimeout(function() {
                    result.push(3);
                    resolve();
                }, timeout);
            }
        })
    ];
    queues.forEach(function(queue) {
        jobs.forEach(function(job) {
            queue.enqueue(job);
        });
    });
    
    function getDequeueSequence(queue, jobs) {
        var indexes = [];
        while (!queue.isEmpty()) {
            var job = queue.dequeue();
            indexes.push(jobs.indexOf(job));
        }
        return indexes;
    }
    // expected order: 1, 3, 0, 2
    test("queue0", function() {
        deepEqual(getDequeueSequence(queues[0], jobs), [1, 3, 0, 2]);
    });
    
    jobs[1].set("priority", Job.Priority.Low);
    // expected order: 3, 0, 2, 1
    test("queue1", function() {
        deepEqual(getDequeueSequence(queues[1], jobs), [3, 0, 2, 1]);
    });
    
    jobs[2].set("priority", Job.Priority.High);
    // expected order: 3, 2, 0, 1
    test("queue2", function() {
        deepEqual(getDequeueSequence(queues[2], jobs), [3, 2, 0, 1]);
    });
    
    test("queue3", function() {
        queues[3].dequeue();
        queues[3].dequeue();
        jobs[1].set("priority", Job.Priority.High);
        deepEqual(getDequeueSequence(queues[3], jobs), [1, 0]);
    });
    
    var pool = new Pool();
    pool.process(queues[4]);
    setTimeout(function() {
        test("pool", function() {
            deepEqual(result, [3, 2, 1, 0]);
        });
    }, timeout * (jobs.length + 1));
});
