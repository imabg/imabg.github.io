---
title: "CockroachDB - The resilient Geo-distributed SQL database"
tags:
  - whitepapers
  - database
  - 2025
---

CockroachDB is a scalable SQL DBMS that was built from the ground up to support these global OLTP workloads while maintaining high availability and strong consistency. Just like its namesake, CRDB<sup id="fnref1"><a href="#fn1">[1]</a></sup> is resilient to disasters through replication and automatic recovery mechanisms.

### Main features of CRDB

- **Fault tolerance and high availability**: To provide fault tolerance, CRDB maintains at least three replicas of every partition in the database across diverse geographic zones.
- **Geo-distributed partitioning and replica placement**: CRDB is horizontally scalable, automatically increasing capacity and migrating data as nodes are added.
- **High-performance transactions**: CRDB’s novel transaction protocol supports performant geo-distributed transactions that can span multiple partitions. It provides serializable isolation using no specialized hardware; a standard clock synchronization mechanism such as NTP is sufficient. As a result, CRDB can be run on off-the-shelf servers, including those of public and private clouds.
- CRDB supports the SQL standard with a state-of-the-art query optimizer and distributed SQL execution engine.
- CRDB is a cloud-neutral, meaning a single CRDB cluster can span an arbitrary number of different public and private clouds.

### Architecture of CRDB

CRDB uses a standard shared-nothing architecture, in which all nodes are used for both data storage and computation.

- **SQL**. At the highest level is the SQL layer, which is the interface for all user interactions with the database. It includes the parser, optimizer, and the SQL execution engine, which convert high-level SQL statements to low-level read and write requests to the underlying key-value (KV) store
- **Transactional KV**. Requests from the SQL layer are passed to the Transactional KV layer that ensures atomicity of changes spanning multiple KV pairs. It is also largely responsible for CRDB’s isolation guarantees. 
- **Distribution**. This layer presents the abstraction of a monolithic logical key space ordered by key. All data is addressable within this key space, whether it be system data (used for internal data structures and metadata) or user data (SQL tables and indexes).
  - CRDB uses range-partitioning on the keys to divide the data into contiguous ordered chunks of size ~64 MiB, that are stored across the cluster. We call these chunks Ranges.
  - The Distribution layer is responsible for identifying which Ranges should handle which subset of each query, and routes the subsets accordingly.
  - Ranges start empty, grow, split when they get too large, and merge when they get too small. Ranges also split based on load to reduce hotspots and imbalances in CPU usage.
    - *Replication*. By default, each Range is replicated three ways, with each replica stored on a different node.
    - *Storage*. This is the bottommost level, and represents a local disk-backed KV store. It provides efficient writes and range scans to enable performant SQL execution. At the time of writing, we rely on RocksDB 

### Fault tolerance & High Availability 

CRDB guarantees fault tolerance and high availability through replication of data, automatic recovery mechanisms in case of failure, and strategic data placement

- **Replication using Raft**. CRDB uses the Raft consensus algorithm for consistent replication. Replicas of a Range form a Raft group, where each replica is either a long-lived leader coordinating all writes to the Raft group, or a follower.
  - Raft maintains a consistent, ordered log of updates across a Range’s replicas, and each replica individually applies commands to the storage engine as Raft declares them to be committed to the Range’s log.
  - *CRDB uses Range-level leases, where a single replica in the Raft group (usually the Raft group leader) acts as the leaseholder. It is the only replica allowed to serve authoritative up-to-date reads or propose writes to the Raft group leader. Because all writes go through the leaseholder, reads can bypass networking round trips required by Raft without sacrificing consistency.*
- **Membership changes and automatic load (re)balancing**. Nodes can be added to or removed from running CRDB clusters, and can fail temporarily or even permanently. CRDB treats all of these scenarios similarly: they all cause load to be redistributed across the new and/or remaining live nodes. 
  - For short-term failures, CRDB uses Raft to operate seamlessly as long as a majority of replicas remain available. Raft ensures the election of a new leader for the Raft group if the leader fails so that transactions can continue. Affected replicas can rejoin their group once back online, and peers help them catch up on missed updates by either (1) sending a snapshot of the full Range data, or (2) sending a set of missing Raft log entries to be applied. The method used is determined based on the number of writes that occurred while the replica was unavailable.
  - For longer-term failures, CRDB automatically creates new replicas of under-replicated Ranges (using the unaffected replicas as sources), and determines placement as described in the next section. The node liveness data and cluster metrics required to make this determination are disseminated across the cluster using a peer-to-peer gossip protocol.
- **Replica placement**. CRDB has both manual and automatic mechanisms to control replica placement.


### Footnotes
1. <a id="fn1"></a>CockroachDB<a href="#fnref1">↩︎</a>