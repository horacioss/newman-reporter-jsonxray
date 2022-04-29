let _ = require("lodash");
let path = require("path");
const options = require(path.resolve(process.cwd(), "Options.json"));

/**
 * 
 * @param {object} summary 
 * @returns 
 */
function createReport(summary) {
    
    const testExecutionResults = {};

    let testExecutionInfo = {
        user: options.user,
        summary: "Test Execution for Test Plan " + options.testPlaKey,
        startDate: new Date(summary.run.timings.started),
        finishDate: new Date(summary.run.timings.completed),
        testPlanKey: options.testPlaKey
    }
    
    let tests = [];
    let timeToStarTest = summary.run.timings.started;

    _.forEach(summary.run.executions, function(execution) {


        let requestName = execution.item.name;
        let testKey = requestName.includes("|") ? requestName.split("|")[0] : "";
        let testSummary = requestName.includes("|") ? requestName.split("|")[1] :  requestName;
        let status = "PASSED";
        let start = new Date(timeToStarTest);
        let finish = new Date(timeToStarTest + execution.response?.responseTime);
        let testRunComment = "Execution Successfully"
        timeToStarTest += execution.response?.responseTime;
        let assertions = execution.assertions;

        for(let i = 0; i< assertions?.length; i++) {
            if (assertions[i].error) {
                testRunComment = `Assertion Error: ${assertions[i].error.message} in \"${assertions[i].error.test}\"`;
                status = "FAILED"
                break;
            }
            continue;
        }
        

        let test = {
           testKey,
           status,
           assignee: options.accountId,
           executedBy: options.accountId,
           start,
           finish,
           comment: testRunComment,
           testInfo: {
               summary: testSummary,
               type: options.type,
               projectKey: options.projectKey
           }
        }

        tests.push(test)

    });

    
    Object.assign(testExecutionResults, {
        "testExecutionKey": "",
        "info": testExecutionInfo,
        "tests": tests
    });

    return testExecutionResults;

}

module.exports = function(newman, options) {
    newman.on('beforeDone', function(err, data) {
        if (err) { return; }

        newman.exports.push({
            name: 'jsonxray-reporter',
            default: 'execution-results.json',
            path: options.export,
            content: JSON.stringify(createReport(data.summary), 0, 4)
        })
    })
}
