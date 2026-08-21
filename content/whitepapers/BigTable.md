---
title: "Notes - Google Bigtable - Distributed storage for structured data"
draft: false
tags:
  - whitepapers
  - 2026
---

**Paper <a href="https://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-osdi06.pdf" target="_blank">Link</a>**

## Overview

- Bigtable is a distributed storage system for managing structured data that is designed to scale to a very large size: petabytes of data across thousands of commodity servers
- Bigtable is designed to reliably scale to petabytes of data and thousands of machines. Bigtable has achieved several goals: wide applicability, scalability, high performance, and high availability

## Data model

- Bigtable does not support a full relational data model; instead, it provides clients with a simple data model that supports dynamic control over data layout and format, and allows clients to reason about the locality properties of the data represented in the underlying storage
- Data is indexed using row and column names that can be arbitrary strings
- Bigtable also treats data as uninterpreted strings, although clients often serialize various forms of structured and semi-structured data into these strings
- Clients can control the locality of their data through careful choices in their schemas
- Bigtable schema parameters let clients dynamically control whether to serve data out of memory or from disk

## Rows and tablets

- The row keys in a table are arbitrary strings (currently up to 64KB in size, although 10-100 bytes is a typical size for most of our users)
- Every read or write of data under a single row key is atomic (regardless of the number of different columns being read or written in the row)
- Bigtable maintains data in lexicographic order by row key
- The row range for a table is dynamically partitioned. Each row range is called a tablet, which is the unit of distribution and load balancing

## Columns

- Column keys are grouped into sets called column families, which form the basic unit of access control
- All data stored in a column family is usually of the same type (we compress data in the same column family together)
- A column key is named using the following syntax: `family:qualifier`. Column family names must be printable, but qualifiers may be arbitrary strings

## Versions and garbage collection

- Each cell in a Bigtable can contain multiple versions of the same data; these versions are indexed by timestamp. Bigtable timestamps are 64-bit integers
- Different versions of a cell are stored in decreasing timestamp order, so that the most recent versions can be read first
- To make the management of versioned data less onerous, we support two per-column-family settings that tell Bigtable to garbage-collect cell versions automatically
- The client can specify either that only the last n versions of a cell be kept, or that only new-enough versions be kept (e.g., only keep values that were written in the last seven days)

## API

- Bigtable supports single-row transactions, which can be used to perform atomic read-modify-write sequences on data stored under a single row key
- Bigtable does not currently support general transactions across row keys, although it provides an interface for batching writes across row keys at the clients
- Bigtable allows cells to be used as integer counters
- Bigtable supports the execution of client-supplied scripts in the address spaces of the servers
- Bigtable can be used with MapReduce

## Dependencies

- Bigtable depends on a cluster management system for scheduling jobs, managing resources on shared machines, dealing with machine failures, and monitoring machine status
- The Google SSTable file format is used internally to store Bigtable data
- An SSTable can be completely mapped into memory, which allows us to perform lookups and scans without touching disk

### Chubby (distributed lock service)

- Bigtable relies on a highly-available and persistent distributed lock service called Chubby
- A Chubby service consists of five active replicas, one of which is elected to be the master and actively serve requests
- The service is live when a majority of the replicas are running and can communicate with each other
- Chubby uses the Paxos algorithm to keep its replicas consistent in the face of failure
- Chubby provides a namespace that consists of directories and small files. Each directory or file can be used as a lock, and reads and writes to a file are atomic
- The Chubby client library provides consistent caching of Chubby files
- Each Chubby client maintains a session with a Chubby service. A client’s session expires if it is unable to renew its session lease within the lease expiration time
- When a client’s session expires, it loses any locks and open handles
- Chubby clients can also register callbacks on Chubby files and directories for notification of changes or session expiration

Bigtable uses Chubby for a variety of tasks:

- to ensure that there is at most one active master at any time
- to store the bootstrap location of Bigtable data
- to discover tablet servers and finalize tablet server deaths
- to store Bigtable schema information (the column family information for each table)
- to store access control lists

## Reads

- To improve read performance, tablet servers use two levels of caching
	- The **Scan Cache** is a higher-level cache that caches the key-value pairs returned by the SSTable interface to the tablet server code
	- The **Block Cache** is a lower-level cache that caches SSTables blocks that were read from GFS
- A read operation has to read from all SSTables that make up the state of a tablet. If these SSTables are not in memory, we may end up doing many disk accesses
- We reduce the number of accesses by allowing clients to specify that Bloom filters should be created for SSTables in a particular locality group

## Commit log and recovery

- If we kept the commit log for each tablet in a separate log file, a very large number of files would be written concurrently in GFS
- Using one log provides significant performance benefits during normal operation, but it complicates recovery
- When a tablet server dies, the tablets that it served will be moved to a large number of other tablet servers: each server typically loads a small number of the original server’s tablets
- To recover the state for a tablet, the new tablet server needs to reapply the mutations for that tablet from the commit log written by the original tablet server. However, the mutations for these tablets were co-mingled in the same physical log file
- We avoid duplicating log reads by first sorting the commit log entries in order of the keys 〈table, row name, log sequence number〉
- In the sorted output, all mutations for a particular tablet are contiguous and can therefore be read efficiently with one disk seek followed by a sequential read
- To parallelize the sorting, we partition the log file into 64 MB segments, and sort each segment in parallel on different tablet servers
- This sorting process is coordinated by the master and is initiated when a tablet server indicates that it needs to recover mutations from some commit log file

## Tablet moves

- If the master moves a tablet from one tablet server to another, the source tablet server first does a minor compaction on that tablet
- This compaction reduces recovery time by reducing the amount of uncompacted state in the tablet server’s commit log
- After finishing this compaction, the tablet server stops serving the tablet

## Concurrency and deletion

- We do not need any synchronization of accesses to the file system when reading from SSTables. As a result, concurrency control over rows can be implemented very efficiently
- The only mutable data structure that is accessed by both reads and writes is the memtable
- To reduce contention during reads of the memtable, we make each memtable row copy-on-write and allow reads and writes to proceed in parallel
- Since SSTables are immutable, the problem of permanently removing deleted data is transformed to garbage collecting obsolete SSTables
- Each tablet’s SSTables are registered in the METADATA table
- The master removes obsolete SSTables as a mark-and-sweep garbage collection over the set of SSTables, where the METADATA table contains the set of roots
