---
title: "Notes - Google MapReduce - Simplified Data Processing on Large Clusters"
draft: false
tags:
  - whitepapers
  - 2026
---

**Paper <a href="https://static.googleusercontent.com/media/research.google.com/en//archive/mapreduce-osdi04.pdf" target="_blank">Link</a>**

## Overview

- Nothing fancy is done by the master, just a map of machines and location of files

## Execution / shuffle-sort

- When a reduce worker has read all intermediate data, it sorts it by the intermediate keys so that all occurrences of the same key are grouped together
- The sorting is needed because typically many different keys map to the same reduce task
- If the amount of intermediate data is too large to fit in memory, an external sort is used

![[mapreduce-execution.png]]<br>

## Fault tolerance

- It is easy to make the master write periodic checkpoints of the master data structures described above
- If the master task dies, a new copy can be started from the last checkpointed state
- In case of master fails, client should retry instead of relying on MapReduce library — retry need to be handled by client

![[mapreduce-master.png]]<br>

## Locality

- When running large MapReduce operations on a significant fraction of the workers in a cluster, most input data is read locally and consumes no network bandwidth

## Task granularity

- There are practical bounds on how large M and R can be in our implementation, since the master must make O(M + R) scheduling decisions and keeps O(M ∗ R) state in memory as described above
- The constant factors for memory usage are small however: the O(M ∗ R) piece of the state consists of approximately one byte of data per map task/reduce task pair
- In practice, we tend to choose M so that each individual task is roughly 16 MB to 64 MB of input data (so that the locality optimization described above is most effective)

## Stragglers

- A “straggler”: a machine that takes an unusually long time to complete one of the last few map or reduce tasks in the computation

## Partitioning

- A default partitioning function is provided that uses hashing (e.g. “hash(key) mod R”)
- This tends to result in fairly well-balanced partitions
- In some cases, however, it is useful to partition data by some other function of the key

## Ordering

- We guarantee that within a given partition, the intermediate key/value pairs are processed in increasing key order
- This ordering guarantee makes it easy to generate a sorted output file per partition, which is useful when the output file format needs to support efficient random access lookups by key, or users of the output find it convenient to have the data sorted

## Combiner

- We allow the user to specify an optional Combiner function that does partial merging of this data before it is sent over the network
- The Combiner function is executed on each machine that performs a map task
- Typically the same code is used to implement both the combiner and the reduce functions
- The only difference between a reduce function and a combiner function is how the MapReduce library handles the output of the function
- The output of a reduce function is written to the final output file
- The output of a combiner function is written to an intermediate file that will be sent to a reduce task
- Partial combining significantly speeds up certain classes of MapReduce operations

![[mapreduce-combiner.png]]<br>

## Skipping bad records

- We provide an optional mode of execution where the MapReduce library detects which records cause deterministic crashes and skips these records in order to make forward progress
- Each worker process installs a signal handler that catches segmentation violations and bus errors
- Before invoking a user Map or Reduce operation, the MapReduce library stores the sequence number of the argument in a global variable
- If the user code generates a signal, the signal handler sends a “last gasp” UDP packet that contains the sequence number to the MapReduce master
- When the master has seen more than one failure on a particular record, it indicates that the record should be skipped when it issues the next re-execution of the corresponding Map or Reduce task

![[mapreduce-skip-records.png]]<br>

## Counters

- User code creates a named counter object and then increments the counter appropriately in the Map and/or Reduce function
- The counter values from individual worker machines are periodically propagated to the master (piggybacked on the ping response)
- The master aggregates the counter values from successful map and reduce tasks and returns them to the user code when the MapReduce operation is completed
- The current counter values are also displayed on the master status page so that a human can watch the progress of the live computation
- When aggregating counter values, the master eliminates the effects of duplicate executions of the same map or reduce task to avoid double counting
- Duplicate executions can arise from our use of backup tasks and from re-execution of tasks due to failures

## Experience

- The indexing system takes as input a large set of documents that have been retrieved by our crawling system, stored as a set of GFS files
- The raw contents for these documents are more than 20 terabytes of data
- The indexing process runs as a sequence of five to ten MapReduce operations
