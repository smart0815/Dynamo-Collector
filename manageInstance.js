if (process.argv[2].toUpperCase() === "START") {
    // Call EC2 to start the selected instances
    ec2.startInstances(params, function(err, data) {
      if (err && err.code === 'DryRunOperation') {
        params.DryRun = false;
        ec2.startInstances(params, function(err, data) {
            if (err) {
              console.log("Error", err);
            } else if (data) {
              console.log("Success", data.StartingInstances);
            }
        });
      } else {
        console.log("You don't have permission to start instances.");
      }
    });
  } else if (process.argv[2].toUpperCase() === "STOP") {
    // Call EC2 to stop the selected instances
    ec2.stopInstances(params, function(err, data) {
      if (err && err.code === 'DryRunOperation') {
        params.DryRun = false;
        ec2.stopInstances(params, function(err, data) {
            if (err) {
              console.log("Error", err);
            } else if (data) {
              console.log("Success", data.StoppingInstances);
            }
        });
      } else {
        console.log("You don't have permission to stop instances");
      }
    });
  }